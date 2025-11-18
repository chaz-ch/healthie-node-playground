import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { HealthieService } from './healthie.service';
import { UserLookupDto } from '../dto/user-lookup.dto';
import { ConversationDto } from '../dto/conversation.dto';
import { CreateNoteDto } from '../dto/create-note.dto';

@Controller('api')
export class HealthieController {
  constructor(private readonly healthieService: HealthieService) {}

  @Post('user')
  async getUser(@Body() userLookupDto: UserLookupDto) {
    try {
      if (!userLookupDto.userId) {
        throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
      }

      const data = await this.healthieService.getUserData(userLookupDto.userId);
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to fetch user data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('conversation')
  async getConversation(@Body() conversationDto: ConversationDto) {
    try {
      if (!conversationDto.conversationId) {
        throw new HttpException('Conversation ID is required', HttpStatus.BAD_REQUEST);
      }

      const data = await this.healthieService.getConversationData(conversationDto.conversationId);
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to fetch conversation data',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-note')
  async createNote(@Body() createNoteDto: CreateNoteDto) {
    try {
      if (!createNoteDto.conversationId || !createNoteDto.content || !createNoteDto.userId) {
        throw new HttpException(
          'Conversation ID, content, and user ID are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.healthieService.createNote(
        createNoteDto.conversationId,
        createNoteDto.content,
        createNoteDto.userId,
      );
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to create note',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('websocket-url')
  getWebSocketUrl() {
    return this.healthieService.getWebSocketUrlForClient();
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', message: 'Server is running' };
  }
}

