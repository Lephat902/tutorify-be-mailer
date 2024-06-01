import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import {
  ApplicationStatus,
  ClassApplicationCreatedEventPattern,
  ClassApplicationCreatedEventPayload,
  ClassApplicationUpdatedEventPattern,
  ClassApplicationUpdatedEventPayload,
  ClassSessionCreatedEventPattern,
  ClassSessionCreatedEventPayload,
  ClassSessionUpdatedEventPattern,
  ClassSessionUpdatedEventPayload,
  MultipleClassSessionsCreatedEventPattern,
  MultipleClassSessionsCreatedPayload,
  TutorApprovedEventPattern,
  TutorApprovedEventPayload,
  TutorRejectedEventPattern,
  TutorRejectedEventPayload,
  UserCreatedEventPattern,
  UserCreatedEventPayload,
  UserRole,
} from "@tutorify/shared";
import { APIGatewayProxy } from "src/proxies";
import { MailService } from "../mail.service";

@Controller()
export class EventHandler {
  constructor(
    private readonly mailService: MailService,
    private readonly _APIGatewayProxy: APIGatewayProxy
  ) {}

  @EventPattern(new UserCreatedEventPattern())
  async handleUserCreated(payload: UserCreatedEventPayload) {
    const { role } = payload;
    if (role === UserRole.TUTOR) {
      await this.handleTutorCreated(payload);
    }
  }

  private async handleTutorCreated(payload: UserCreatedEventPayload) {
    const { email, firstName, middleName, lastName } = payload;
    const fullName = `${firstName} ${middleName} ${lastName}`;
    console.log(
      `Start sending tutor-application received email to tutor ${fullName}`
    );

    await this.mailService.sendTutorApplicationReceived({
      email,
      name: fullName,
    });
  }

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
    // Ignore other recurring sessions
    if (!payload.isFirstSessionInBatch) {
      return;
    }
    const {
      classId,
      classSessionId,
      title,
      startDatetime,
      endDatetime,
      createdAt,
      numOfSessionsCreatedInBatch,
    } = payload;
    console.log(`Start sending session-created notifications`);
    const classData =
      await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

    await this.mailService.sendSessionCreated(
      {
        email: student.email,
        name: studentFullName,
      },
      {
        classTitle: classData.class.title,
        sessionTitle: title,
        startDatetime: new Date(startDatetime).toUTCString(),
        endDatetime: new Date(endDatetime).toUTCString(),
        createdAt: new Date(createdAt).toUTCString(),
        urlToSession,
        numOfOtherSessionsCreatedInBatch: numOfSessionsCreatedInBatch - 1,
      }
    );
  }

  @EventPattern(new ClassSessionUpdatedEventPattern())
  async handleClassSessionUpdated(payload: ClassSessionUpdatedEventPayload) {
    const {
      classId,
      classSessionId,
      title,
      updatedAt,
      feedbackUpdatedAt,
      tutorFeedback,
      isCancelled,
    } = payload;
    const classData =
      await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

    if (!isCancelled && updatedAt && updatedAt === feedbackUpdatedAt) {
      console.log(`Start sending session-feedback-updated notifications`);
      await this.mailService.sendSessionFeedbackUpdated(
        {
          email: student.email,
          name: studentFullName,
        },
        {
          classTitle: classData.class.title,
          sessionTitle: title,
          urlToSession,
          feedbackText: tutorFeedback,
        }
      );
    } else if (isCancelled && updatedAt) {
      console.log(`Start sending session-cancelled notifications`);
      await this.mailService.sendSessionCancelled(
        {
          email: student.email,
          name: studentFullName,
        },
        {
          classTitle: classData.class.title,
          sessionTitle: title,
          urlToSession,
          cancellationReason: tutorFeedback,
        }
      );
    }
  }

  @EventPattern(new ClassApplicationCreatedEventPattern())
  async handleApplicationCreated(payload: ClassApplicationCreatedEventPayload) {
    const { classId, tutorId, isDesignated } = payload;
    const classAndTutor =
      await this._APIGatewayProxy.getDataByApplicationCreatedHandler(
        classId,
        tutorId
      );
    const urlToClass = `https://www.tutorify.site/classes/${classId}`;
    const tutor = classAndTutor.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    // Send email to tutor
    if (isDesignated) {
      await this.mailService.sendTutoringRequestCreated(
        {
          email: tutor.email,
          name: tutorFullName,
        },
        {
          classTitle: classAndTutor.class.title,
          urlToClass,
        }
      );
    }
    // Send email to student
    else {
      const urlToTutor = `https://www.tutorify.site/tutors/${tutorId}`;
      const student = classAndTutor.class.student;
      const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
      await this.mailService.sendClassApplicationCreated(
        {
          email: student.email,
          name: studentFullName,
        },
        {
          classTitle: classAndTutor.class.title,
          urlToClass,
          tutorName: tutorFullName,
          urlToTutor,
        }
      );
    }
  }

  @EventPattern(new ClassApplicationUpdatedEventPattern())
  async handleApplicationStatusChanged(
    payload: ClassApplicationUpdatedEventPayload
  ) {
    const { classId, tutorId, newStatus, isDesignated } = payload;
    // Avoid unneccessary queries
    if (newStatus !== ApplicationStatus.APPROVED) return;
    const classAndTutor =
      await this._APIGatewayProxy.getDataByApplicationCreatedHandler(
        classId,
        tutorId
      );
    const urlToCourse = `https://www.tutorify.site/courses/${classId}`;
    const urlToMyClasses = "https://www.tutorify.site/myclasses";
    const tutor = classAndTutor.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    if (newStatus === ApplicationStatus.APPROVED) {
      const student = classAndTutor.class.student;
      const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;

      if (isDesignated) {
        // Notify student
        await this.mailService.sendTutoringRequestAccepted(
          {
            email: student.email,
            name: studentFullName,
          },
          {
            tutorName: tutorFullName,
            urlToCourse,
            urlToMyClasses,
          }
        );
      } else {
        // Notify tutor
        await this.mailService.sendClassApplicationAccepted(
          {
            email: tutor.email,
            name: tutorFullName,
          },
          {
            urlToCourse,
            urlToMyClasses,
          }
        );
      }
    }
  }

  @EventPattern(new MultipleClassSessionsCreatedEventPattern())
  async handleMultipleClassSessionsCreateDto(
    payload: MultipleClassSessionsCreatedPayload
  ) {
    const {
      tutorId,
      classId,
      title,
      description,
      startDate,
      timeSlots,
      endDateForRecurringSessions,
    } = payload;
    console.log(`Start sending session-created ics file`);
    const classData =
      await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const tutorData = await this._APIGatewayProxy.getTutorDatabyId(tutorId);
    const tutor = tutorData.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    await this.mailService.sendMultipleSessionCreated(
      {
        name: studentFullName,
        email: student.email,
      },
      {
        name: tutorFullName,
        email: tutor.email,
      },
      {
        title,
        description,
        startDate,
        timeSlots,
        endDateForRecurringSessions,
      }
    );
  }
}
