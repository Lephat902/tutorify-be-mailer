import { ClassTimeSlot } from "@tutorify/shared";

export type ICSContentDto = {
  title: string;
  description: string;
  startDate: string;
  timeSlots: ClassTimeSlot[];
  endDateForRecurringSessions: string;
};
