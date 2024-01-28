import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, _: ArgumentsHost) {
    console.log(exception);
    if (exception instanceof RpcException) {
      // If it's already an RcpException, leave it unchanged
      throw exception;
    } else if (exception instanceof HttpException) {
      throw new RpcException(exception.getResponse());
    } else {
      throw exception;
    }
  }
}
