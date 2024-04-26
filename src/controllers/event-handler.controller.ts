import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { MailService } from '../mail.service';
import {
  ClassApplicationCreatedEventPattern,
  ClassApplicationCreatedEventPayload,
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
    const classData = await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
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
    const classData = await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

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

  @EventPattern(new ClassApplicationCreatedEventPattern())
  async handleApplicationCreated(payload: ClassApplicationCreatedEventPayload) {
    const { classId, tutorId, isDesignated } = payload;
    const classAndTutor = await this._APIGatewayProxy.getDataByApplicationCreatedHandler(classId, tutorId);
    const urlToClass = `https://www.tutorify.site/classes/${classId}`;
    const tutor = classAndTutor.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    // Send email to tutor
    if (isDesignated) {
      await this.mailService.sendTutoringRequestCreated({
        email: tutor.email,
        name: tutorFullName,
      }, {
        classTitle: classAndTutor.class.title,
        urlToClass,
      });
    }
    // Send email to student
    else {
      const urlToTutor = `https://www.tutorify.site/tutors/${tutorId}`;
      const student = classAndTutor.class.student;
      const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
      await this.mailService.sendClassApplicationCreated({
        email: student.email,
        name: studentFullName,
      }, {
        classTitle: classAndTutor.class.title,
        urlToClass,
        tutorName: tutorFullName,
        urlToTutor
      });
    }
  }
}
