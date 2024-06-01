import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { UserDto } from "src/dto/user.dto";
import { ConfigService } from "@nestjs/config";
import { MailType, MailOptions } from "./constants";
import { ICSContentDto } from "src/dto/ics-content.dto";
import { EventAttributes, createEvents } from "ics";
import { template } from "handlebars";

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService
  ) {}

  async sendUserConfirmation(user: UserDto, token: string) {
    const { email, name } = user;
    const url = `${this.configService.get("EMAIL_CONFIRMATION_PATH")}${token}`;
    await this.sendMail(email, MailType.EMAIL_CONFIRMATION, {
      name,
      url,
    });
  }

  async sendResetPassword(user: UserDto, token: string) {
    const { email, name } = user;
    const url = `${this.configService.get("RESET_PASSWORD_PATH")}${token}`;
    await this.sendMail(email, MailType.RESET_PASSWORD, {
      name,
      url,
    });
  }

  async sendNewPassword(user: UserDto, newPassword: string) {
    const { email, name } = user;
    await this.sendMail(email, MailType.SEND_NEW_PASSWORD, {
      name,
      newPassword,
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

  async sendSessionCreated(
    user: UserDto,
    sessionCreatedEmailContent: SessionCreatedEmailContent
  ) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_SESSION_CREATED, {
      name,
      ...sessionCreatedEmailContent,
    });
  }

  async sendSessionFeedbackUpdated(
    user: UserDto,
    sessionFeedbackUpdatedEmailContent: SessionFeedbackUpdatedEmailContent
  ) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_SESSION_FEEDBACK_UPDATED, {
      name,
      ...sessionFeedbackUpdatedEmailContent,
    });
  }

  async sendSessionCancelled(
    user: UserDto,
    sessionCancelledEmailContent: SessionCancelledEmailContent
  ) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_SESSION_CANCELLED, {
      name,
      ...sessionCancelledEmailContent,
    });
  }

  async sendTutoringRequestCreated(
    user: UserDto,
    newTutoringRequestEmailContent: NewTutoringRequestEmailContent
  ) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTORING_REQUEST_CREATED, {
      name,
      ...newTutoringRequestEmailContent,
    });
  }

  async sendClassApplicationCreated(
    user: UserDto,
    newClassApplicationEmailContent: NewClassApplicationEmailContent
  ) {
    const { email, name } = user;
    await this.sendMail(email, MailType.CLASS_APPLICATION_CREATED, {
      name,
      ...newClassApplicationEmailContent,
    });
  }

  async sendTutoringRequestAccepted(
    user: UserDto,
    tutoringRequestAcceptedEmailContent: TutoringRequestAcceptedEmailContent
  ) {
    const { email, name } = user;
    await this.sendMail(email, MailType.TUTORING_REQUEST_ACCEPTED, {
      name,
      ...tutoringRequestAcceptedEmailContent,
    });
  }

  async sendClassApplicationAccepted(
    user: UserDto,
    classApplicationAcceptedEmailContent: ClassApplicationAcceptedEmailContent
  ) {
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
    const blockedDomains = process.env.BLOCKED_DOMAINS.split(",");
    const domain = email.split("@")[1];

    if (blockedDomains.includes(domain)) {
      console.log(`Blocked domain. Email to ${email} not sent.`);
      return;
    }

    const mailOptions = MailOptions[type];

    await this.mailerService.sendMail({
      ...mailOptions,
      to: email,
      context,
    });
  }

  async sendMultipleSessionCreated(
    student: UserDto,
    tutor: UserDto,
    icsContent: ICSContentDto
  ) {
    const endDate = new Date(icsContent.endDateForRecurringSessions);
    console.log("endDate ", endDate);
    endDate.setHours(23);
    endDate.setMinutes(59);
    endDate.setSeconds(59);
    const icsDateTime =
      endDate.toISOString().replace(/[-:]/g, "").substring(0, 15) + "Z";
    const endRule = `UNTIL=${icsDateTime}`;

    console.log("timeSlots: ", icsContent.timeSlots);

    const events = icsContent.timeSlots.map(
      (timeSlot) =>
        ({
          start: new Date(timeSlot.startTime).getTime(),
          startInputType: "utc",
          startOutputType: "utc",
          endInputType: "utc",
          endOutputType: "utc",
          end: new Date(timeSlot.endTime).getTime(),
          title: icsContent.title,
          description: icsContent.description,
          status: "TENTATIVE",
          organizer: tutor,
          attendees: [
            {
              ...student,
              rsvp: true,
              partstat: "TENTATIVE",
              role: "REQ-PARTICIPANT",
            },
          ],
          recurrenceRule: `FREQ=WEEKLY;BYDAY=${timeSlot.weekday.substring(0, 2)};INTERVAL=1;${endRule}`,
        }) as EventAttributes
    );

    createEvents(events, async (error, value) => {
      if (error) {
        console.log(error);
        return;
      }

      const mailOptions = {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: "New class sessions to Google Calendar",
        template: "./session-created",
        attachments: [
          {
            filename: "events.ics",
            content: value,
          },
        ],
      };

      console.log("student mail: ", student.email);
      console.log("tutor email: ", tutor.email);
      console.log("value: ", value);

      const sendMailToStudentPromise = this.mailerService.sendMail({
        to: student.email,
        ...mailOptions,
      });

      const sendMailToTutorPromise = this.mailerService.sendMail({
        to: tutor.email,
        ...mailOptions,
      });

      await Promise.all([sendMailToStudentPromise, sendMailToTutorPromise]);
    });
  }
}
