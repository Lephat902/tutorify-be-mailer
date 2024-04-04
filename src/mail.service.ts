import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserDto } from 'src/dto/user.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) { }

  async sendUserConfirmation(user: UserDto, token: string) {
    const url = `${this.configService.get('EMAIL_CONFIRMATION_PATH')}${token}`;

    await this.mailerService.sendMail({
      from: '"Support Team" <noreply@tutorify.com>', // override default from
      to: user.email,
      subject: 'Welcome to Tutorify! Confirm your Email',
      template: './confirmation',
      context: {
        name: user.name,
        url,
      },
    });
  }
}
