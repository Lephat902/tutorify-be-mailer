import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class APIGatewayProxy {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getDataBySessionEventsHandler(classId: string): Promise<Class> {
    const query = `
      query ExampleQuery($classId: String!) {
        class(id: $classId) {
          student {
            email
            lastName
            firstName
            middleName
          }
          title
        }
      }
    `;

    const variables = {
      classId
    };

    const data = await firstValueFrom(this.httpService.post<{
      data: Class;
    }>(
      process.env.API_GATEWAY_GRAPHQL_PATH,
      {
        query,
        variables,
      }
    ));

    return data.data.data;
  }

  async getDataByApplicationCreatedHandler(classId: string, tutorId: string): Promise<Class & Tutor> {
    const query = `
      query ExampleQuery($tutorId: String!, $classId: String!) {
        class(id: $classId) {
          student {
            email
            lastName
            firstName
            middleName
          }
          title
        }
        tutor(id: $tutorId) {
          email
          lastName
          firstName
          middleName
        }
      }
    `;

    const variables = {
      classId,
      tutorId,
    };

    const data = await firstValueFrom(this.httpService.post<{
      data: Class & Tutor;
    }>(
      process.env.API_GATEWAY_GRAPHQL_PATH,
      {
        query,
        variables,
      }
    ));

    return data.data.data;
  }
}