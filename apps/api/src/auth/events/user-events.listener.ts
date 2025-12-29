import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../../mail/mail.service';

export class UserRegisteredEvent {
  email: string;
  name: string;
}

@Injectable()
export class UserEventsListener {
  constructor(private mailService: MailService) {}

  @OnEvent('user.registered')
  async handleUserRegistered(event: UserRegisteredEvent) {
    console.log(`📧 Sending welcome email to ${event.email}`);
    try {
      await this.mailService.sendWelcomeEmail(event.email, event.name);
      console.log(`✅ Welcome email sent successfully to ${event.email}`);
    } catch (error) {
      console.error(`❌ Failed to send welcome email to ${event.email}:`, error);
    }
  }
}
