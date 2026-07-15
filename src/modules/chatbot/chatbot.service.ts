import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatbotSession, ChatbotSessionDocument } from './schemas/chatbot-session.schema';
import { ChatbotSettingsDocument } from './schemas/chatbot-settings.schema';
import { ChatbotSettingsService } from './chatbot-settings.service';
import { Knowledge, KnowledgeDocument } from '../knowledge/schemas/knowledge.schema';
import { Language } from '../../common/enums/language.enum';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectModel(ChatbotSession.name) private readonly model: Model<ChatbotSessionDocument>,
    @InjectModel(Knowledge.name) private readonly knowledgeModel: Model<KnowledgeDocument>,
    private readonly settingsService: ChatbotSettingsService,
  ) {}

  async sendMessage(
    userId: string,
    message: string,
    sessionId?: string,
    preferredLanguage?: string,
  ): Promise<{ reply: string; sessionId: string; escalated: boolean; disabled?: boolean }> {
    const settings = await this.settingsService.getPolicy();

    if (!settings.enabled) {
      return { reply: 'Le chatbot est actuellement désactivé par l\'administrateur.', sessionId: sessionId || '', escalated: false, disabled: true };
    }

    const lang = this.resolveLanguage(settings, preferredLanguage);

    let session: ChatbotSessionDocument;
    if (sessionId) {
      session = await this.model.findById(new Types.ObjectId(sessionId));
    }

    const isNewSession = !session;
    if (!session) {
      session = await this.model.create({
        user: userId ? new Types.ObjectId(userId) : undefined,
        messages: [],
      });
    }

    session.messages.push({ role: 'user', content: message, timestamp: new Date() });

    const escalated =
      settings.moderationEnabled &&
      settings.moderationKeywords.some(k => message.toLowerCase().includes(k.toLowerCase()));

    let reply: string;
    if (isNewSession) {
      reply = settings.greetingMessage[lang] || settings.greetingMessage.fr;
    } else if (escalated) {
      reply =
        'Je comprends votre demande. Je vais transmettre votre message à notre équipe qui vous contactera sous 24h.';
    } else {
      reply = await this.getReply(message, settings, lang);
    }

    if (escalated) {
      session.escalated = true;
      session.escalatedAt = new Date();
      session.status = 'escalated';
    }

    session.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
    await session.save();

    return { reply, sessionId: (session._id as Types.ObjectId).toString(), escalated };
  }

  private resolveLanguage(settings: ChatbotSettingsDocument, preferred?: string): 'fr' | 'ar' | 'wo' {
    const supported = settings.supportedLanguages?.length ? settings.supportedLanguages : [Language.FR];
    if (preferred && supported.includes(preferred as Language)) return preferred as 'fr' | 'ar' | 'wo';
    return supported[0] as 'fr' | 'ar' | 'wo';
  }

  private async getReply(message: string, settings: ChatbotSettingsDocument, lang: 'fr' | 'ar' | 'wo'): Promise<string> {
    const msg = message.toLowerCase();

    if (settings.knowledgeSourceIds?.length) {
      const articles = await this.knowledgeModel
        .find({ _id: { $in: settings.knowledgeSourceIds }, status: 'published' })
        .select('title content tags slug')
        .lean();

      const match = articles.find(
        a =>
          (a.title?.fr && msg.includes(a.title.fr.toLowerCase())) ||
          a.tags?.some(tag => msg.includes(tag.toLowerCase())),
      );
      if (match) {
        const summary = match.content?.fr?.slice(0, 180) || '';
        return `${match.title.fr} — ${summary}${summary.length === 180 ? '…' : ''} (Savoir-faire)`;
      }
    }

    if (msg.includes('offre') || msg.includes('publier'))
      return "Pour publier une offre, allez dans l'onglet Offres et cliquez sur 'Publier une offre'. Remplissez le formulaire avec le type de plastique, la quantité et votre localisation.";
    if (msg.includes('badge'))
      return "Les badges sont attribués automatiquement selon votre activité (kg collectés, offres complétées) ou manuellement par l'administrateur.";
    if (msg.includes('inscription') || msg.includes('compte'))
      return "Pour créer un compte, cliquez sur 'Inscrivez-vous' sur la page de connexion. Vous pourrez ensuite acheter, vendre, ou les deux.";
    if (msg.includes('prix') || msg.includes('tarif'))
      return "Les prix sont fixés par les vendeurs lors de la création d'une offre. Vous pouvez aussi choisir de proposer vos plastiques gratuitement.";
    if (msg.includes('contact') || msg.includes('email'))
      return "Pour nous contacter: support@recaplink.tn ou utilisez la messagerie intégrée pour contacter directement les vendeurs.";
    if (msg.includes('plastique') || msg.includes('pet') || msg.includes('hdpe'))
      return "RecapLink accepte tous types de plastiques: PET (bouteilles), HDPE (bidons), PP (emballages), PVC et autres. Chaque offre précise le type de plastique concerné.";

    return settings.fallbackMessage[lang] || settings.fallbackMessage.fr;
  }

  async getSessions(query: { escalated?: boolean; page?: number }) {
    const filter: any = {};
    if (query.escalated !== undefined) filter.escalated = query.escalated;
    const page = query.page || 1;
    const limit = 20;
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate('user', 'fullName username')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);
    return { data, total, page, limit };
  }

  async getSession(id: string) {
    return this.model
      .findById(new Types.ObjectId(id))
      .populate('user', 'fullName username avatarUrl');
  }

  async resolve(id: string): Promise<void> {
    await this.model.findByIdAndUpdate(new Types.ObjectId(id), {
      status: 'resolved',
      escalated: false,
    });
  }

  async getAnalytics() {
    const settings = await this.settingsService.getPolicy();
    if (!settings.analyticsEnabled) {
      return { enabled: false, message: "L'analytique du chatbot est désactivée dans les paramètres." };
    }

    const [totalSessions, escalatedSessions, resolvedSessions, sessions] = await Promise.all([
      this.model.countDocuments(),
      this.model.countDocuments({ escalated: true }),
      this.model.countDocuments({ status: 'resolved' }),
      this.model.find().select('messages').lean(),
    ]);

    const totalMessages = sessions.reduce((sum, s) => sum + (s.messages?.length || 0), 0);
    const avgMessagesPerSession = totalSessions ? +(totalMessages / totalSessions).toFixed(1) : 0;
    const escalationRate = totalSessions ? +((escalatedSessions / totalSessions) * 100).toFixed(1) : 0;

    return {
      enabled: true,
      totalSessions,
      escalatedSessions,
      resolvedSessions,
      escalationRate,
      avgMessagesPerSession,
    };
  }
}
