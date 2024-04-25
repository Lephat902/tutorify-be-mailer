import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class APIGatewayProxy {
  constructor(
    private readonly httpService: HttpService,
  ) { }

  async getClassById(classId: string): Promise<Class> {
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

    const data = await firstValueFrom(this.httpService.post<ClassGraphQLResponse>(
      process.env.API_GATEWAY_GRAPHQL_PATH,
      {
        query,
        variables,
      }
    ));
    
    return data.data.data;
  }
}