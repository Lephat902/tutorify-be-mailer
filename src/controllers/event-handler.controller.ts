import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { MailService } from '../mail.service';
import {
  TutorApprovedEventPattern,
  TutorApprovedEventPayload,
  TutorRejectedEventPattern,
  TutorRejectedEventPayload
} from '@tutorify/shared';

@Controller()
export class EventHandler {
  constructor(private readonly mailService: MailService) { }

  @EventPattern(new TutorApprovedEventPattern())
  async handleTutorApproved(payload: TutorApprovedEventPayload) {
    const { email, firstName, middleName, lastName } = payload;
    const fullName = `${firstName} ${middleName} ${lastName}`;
    console.log(`Start sending tutor approved email to user ${fullName}`);

    await this.mailService.sendTutorApproved({
      email,
      name: fullName,
    });
  }

  @EventPattern(new TutorRejectedEventPattern())
  async handleTutorRejected(payload: TutorRejectedEventPayload) {
    const { email, firstName, middleName, lastName } = payload;
    const fullName = `${firstName} ${middleName} ${lastName}`;
    console.log(`Start sending tutor rejected email to user ${fullName}`);

    await this.mailService.sendTutorRejected({
      email,
      name: fullName,
    });
  }
}
