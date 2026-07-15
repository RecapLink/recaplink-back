import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly svc: ChatbotService) {}

  @Post('message')
  sendMessage(
    @Body() body: { message: string; sessionId?: string; language?: string },
    @CurrentUser('sub') userId: string,
  ) {
    return this.svc.sendMessage(userId, body.message, body.sessionId, body.language);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('sessions')
  getSessions(@Query() query: any) {
    return this.svc.getSessions(query);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get('sessions/:id')
  getSession(@Param('id') id: string) {
    return this.svc.getSession(id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('sessions/:id/resolve')
  resolve(@Param('id') id: string) {
    return this.svc.resolve(id);
  }

  @Public()
  @Get('faq')
  getFaq() {
    return [
      {
        q: "Comment créer une offre ?",
        a: "Allez dans Offres → Publier une offre et remplissez le formulaire.",
      },
      {
        q: "Comment contacter un vendeur ?",
        a: "Cliquez sur 'Collecter' sur une offre pour envoyer un message.",
      },
      {
        q: "Quels types de plastiques acceptez-vous ?",
        a: "PET, HDPE, PP, PVC et autres types de plastiques recyclables.",
      },
      {
        q: "Comment obtenir un badge ?",
        a: "Les badges sont attribués automatiquement ou par l'administrateur.",
      },
    ];
  }
}
