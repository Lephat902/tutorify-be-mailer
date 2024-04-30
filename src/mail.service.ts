import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserDto } from 'src/dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { MailType, MailOptions } from './constants';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendUserConfirmation(user: UserDto, token: string) {
    const { email, name } = user;
    const url = `${this.configService.get('EMAIL_CONFIRMATION_PATH')}${token}`;
    await this.sendMail(email, MailType.EMAIL_CONFIRMATION, {
      name,
      url
    });
  }

  async sendResetPassword(user: UserDto, token: string) {
    const { email, name } = user;
    const url = `${this.configService.get('RESET_PASSWORD_PATH')}${token}`;
    await this.sendMail(email, MailType.RESET_PASSWORD, {
      name,
      url
    });
  }

  async sendNewPassword(user: UserDto, newPassword: string) {
    const { email, name } = user;
    await this.sendMail(email, MailType.SEND_NEW_PASSWORD, {
      name,
      newPassword
    });
  }

  async sendTutorApproved(user: UserDto) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTOR_APPROVED, {
      name,
    });
  }

  async sendTutorRejected(user: UserDto) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTOR_REJECTED, {
      name,
    });
  }

  async sendSessionCreated(user: UserDto, sessionCreatedEmailContent: SessionCreatedEmailContent) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_SESSION_CREATED, {
      name,
      ...sessionCreatedEmailContent,
    });
  }

  async sendSessionFeedbackUpdated(user: UserDto, sessionFeedbackUpdatedEmailContent: SessionFeedbackUpdatedEmailContent) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_SESSION_FEEDBACK_UPDATED, {
      name,
      ...sessionFeedbackUpdatedEmailContent,
    });
  }

  async sendTutoringRequestCreated(user: UserDto, newTutoringRequestEmailContent: NewTutoringRequestEmailContent) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTORING_REQUEST_CREATED, {
      name,
      ...newTutoringRequestEmailContent,
    });
  }

  async sendClassApplicationCreated(user: UserDto, newClassApplicationEmailContent: NewClassApplicationEmailContent) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_APPLICATION_CREATED, {
      name,
      ...newClassApplicationEmailContent,
    });
  }

  async sendTutoringRequestAccepted(user: UserDto, tutoringRequestAcceptedEmailContent: TutoringRequestAcceptedEmailContent) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTORING_REQUEST_ACCEPTED, {
      name,
      ...tutoringRequestAcceptedEmailContent,
    });
  }

  async sendClassApplicationAccepted(user: UserDto, classApplicationAcceptedEmailContent: ClassApplicationAcceptedEmailContent) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_APPLICATION_ACCEPTED, {
      name,
      ...classApplicationAcceptedEmailContent,
    });
  }

  async sendTutorApplicationReceived(user: UserDto) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTOR_APPLICATION_RECEIVED, {
      name,
    });
  }

  private async sendMail(email: string, type: MailType, context: MailContext) {
    const mailOptions = MailOptions[type];

    await this.mailerService.sendMail({
      ...mailOptions,
      to: email,
      context,
    });
  }
}
