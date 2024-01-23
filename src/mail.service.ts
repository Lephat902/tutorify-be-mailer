import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { UserDto } from 'src/dto/user.dto';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendUserConfirmation(user: UserDto, token: string) {
    const url = `tutorify.com/auth/confirm?token=${token}`;

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
