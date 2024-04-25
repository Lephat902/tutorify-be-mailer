import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserDto } from 'src/dto/user.dto';
import { ConfigService } from '@nestjs/config';
import { MailType, MailOptions } from './constants';

type SessionEmailContent = {
  classTitle: string,
  sessionTitle: string,
  startDatetime: string,
  endDatetime: string,
  createdAt: string,
  urlToSession: string,
}

type MailContext = {
  name: string,
  url?: string,
  newPassword?: string,
} | SessionEmailContent & {
  name: string,
};

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendUserConfirmation(user: UserDto, token: string) {
    const url = `${this.configService.get('EMAIL_CONFIRMATION_PATH')}${token}`;
    await this.sendMail(user, MailType.EMAIL_CONFIRMATION, {
      name: user.name,
      url
    });
  }

  async sendNewPassword(user: UserDto, newPassword: string) {
    await this.sendMail(user, MailType.SEND_NEW_PASSWORD, {
      name: user.name,
      newPassword
    });
  }

  async sendTutorApproved(user: UserDto) {
    await this.sendMail(user, MailType.TUTOR_APPROVED, {
      name: user.name,
    });
  }

  async sendTutorRejected(user: UserDto) {
    await this.sendMail(user, MailType.TUTOR_REJECTED, {
      name: user.name,
    });
  }

  async sendSessionCreated(user: UserDto, sessionEmailContent: SessionEmailContent) {
    await this.sendMail(user, MailType.CLASS_SESSION_CREATED, {
      name: user.name,
      ...sessionEmailContent,
    });
  }

  private async sendMail(user: UserDto, type: MailType, context: MailContext) {
    const mailOptions = MailOptions[type];

    await this.mailerService.sendMail({
      ...mailOptions,
      to: user.email,
      context,
    });
  }
}
