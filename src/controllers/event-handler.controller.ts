import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { MailService } from '../mail.service';
import {
  ClassSessionCreatedEventPattern,
  ClassSessionCreatedEventPayload,
  ClassSessionUpdatedEventPattern,
  ClassSessionUpdatedEventPayload,
  TutorApprovedEventPattern,
  TutorApprovedEventPayload,
  TutorRejectedEventPattern,
  TutorRejectedEventPayload,
} from '@tutorify/shared';
import { APIGatewayProxy } from 'src/proxies';

@Controller()
export class EventHandler {
  constructor(
    private readonly mailService: MailService,
    private readonly _APIGatewayProxy: APIGatewayProxy,
  ) { }

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

  @EventPattern(new ClassSessionCreatedEventPattern())
  async handleClassSessionCreated(payload: ClassSessionCreatedEventPayload) {
    const { classId, classSessionId, title, startDatetime, endDatetime, createdAt } = payload;
    console.log(`Start sending session-created notifications`);
    const classData = await this._APIGatewayProxy.getClassById(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

    await this.mailService.sendSessionCreated({
      email: student.email,
      name: studentFullName,
    }, {
      classTitle: classData.class.title,
      sessionTitle: title,
      startDatetime: new Date(startDatetime).toUTCString(),
      endDatetime: new Date(endDatetime).toUTCString(),
      createdAt: new Date(createdAt).toUTCString(),
      urlToSession,
    });
  }

  @EventPattern(new ClassSessionUpdatedEventPattern())
  async handleClassSessionUpdated(payload: ClassSessionUpdatedEventPayload) {
    const { classId, classSessionId, title, updatedAt, feedbackUpdatedAt, tutorFeedback } = payload;
    const classData = await this._APIGatewayProxy.getClassById(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

    console.log(updatedAt, feedbackUpdatedAt);
    if (updatedAt === feedbackUpdatedAt) {
      console.log(`Start sending session-feedback-updated notifications`);
      await this.mailService.sendSessionFeedbackUpdated({
        email: student.email,
        name: studentFullName,
      }, {
        classTitle: classData.class.title,
        sessionTitle: title,
        urlToSession,
        feedbackText: tutorFeedback,
      });
    }
  }
}
