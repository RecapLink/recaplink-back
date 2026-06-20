import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatbotSession, ChatbotSessionDocument } from './schemas/chatbot-session.schema';

const ESCALATION_KEYWORDS = [
  'humain',
  'agent',
  'parler',
  'urgent',
  'problème',
  'aide',
  'legal',
  'juridique',
];

@Injectable()
export class ChatbotService {
  constructor(
    @InjectModel(ChatbotSession.name) private readonly model: Model<ChatbotSessionDocument>,
  ) {}

  async sendMessage(
    userId: string,
    message: string,
    sessionId?: string,
  ): Promise<{ reply: string; sessionId: string; escalated: boolean }> {
    let session: ChatbotSessionDocument;

    if (sessionId) {
      session = await this.model.findById(new Types.ObjectId(sessionId));
    }

    if (!session) {
      session = await this.model.create({
        user: userId ? new Types.ObjectId(userId) : undefined,
        messages: [],
      });
    }

    session.messages.push({ role: 'user', content: message, timestamp: new Date() });

    const escalated = ESCALATION_KEYWORDS.some((k) => message.toLowerCase().includes(k));
    let reply: string;

    reply = this.getSimpleReply(message);

    if (escalated) {
      reply =
        "Je comprends votre demande. Je vais transmettre votre message à notre équipe qui vous contactera sous 24h.";
      session.escalated = true;
      session.escalatedAt = new Date();
      session.status = 'escalated';
    }

    session.messages.push({ role: 'assistant', content: reply, timestamp: new Date() });
    await session.save();

    return { reply, sessionId: (session._id as Types.ObjectId).toString(), escalated };
  }

  private getSimpleReply(message: string): string {
    const msg = message.toLowerCase();
    if (msg.includes('offre') || msg.includes('publier'))
      return "Pour publier une offre, allez dans l'onglet Offres et cliquez sur 'Publier une offre'. Remplissez le formulaire avec le type de plastique, la quantité et votre localisation.";
    if (msg.includes('badge'))
      return "Les badges sont attribués automatiquement selon votre activité (kg collectés, offres complétées) ou manuellement par l'administrateur.";
    if (msg.includes('inscription') || msg.includes('compte'))
      return "Pour créer un compte, cliquez sur 'Inscrivez-vous' sur la page de connexion et choisissez votre rôle (Collecteur, Recycleur ou Vendeur Plastique).";
    if (msg.includes('prix') || msg.includes('tarif'))
      return "Les prix sont fixés par les vendeurs lors de la création d'une offre. Vous pouvez aussi choisir de proposer vos plastiques gratuitement.";
    if (msg.includes('contact') || msg.includes('email'))
      return "Pour nous contacter: support@recaplink.tn ou utilisez la messagerie intégrée pour contacter directement les collecteurs.";
    if (msg.includes('plastique') || msg.includes('pet') || msg.includes('hdpe'))
      return "RecapLink accepte tous types de plastiques: PET (bouteilles), HDPE (bidons), PP (emballages), PVC et autres. Chaque offre précise le type de plastique concerné.";
    return "Merci pour votre question ! Je suis là pour vous aider avec RecapLink. Pouvez-vous préciser votre demande ? Vous pouvez aussi consulter notre section Savoir-faire pour plus d'informations.";
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
}
