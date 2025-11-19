import { Controller, Post, Get, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
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

  @Get('users')
  async getUsers(@Query('offset') offset?: string, @Query('keywords') keywords?: string) {
    try {
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const keywordsStr = keywords || '';
      const data = await this.healthieService.getUsers(offsetNum, keywordsStr);
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to fetch users list',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-conversation')
  async createConversation(@Body() body: { clinicianId: string; patientId: string; name?: string }) {
    try {
      if (!body.clinicianId || !body.patientId) {
        throw new HttpException(
          'Clinician ID and Patient ID are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.healthieService.createConversation(
        body.clinicianId,
        body.patientId,
        body.name,
      );
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to create conversation',
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

  @Get('form-templates')
  async getFormTemplates(@Query('offset') offset?: string, @Query('keywords') keywords?: string) {
    try {
      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const keywordsStr = keywords || '';
      const data = await this.healthieService.getFormTemplates(offsetNum, keywordsStr);
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to fetch form templates',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('create-chart-note')
  async createChartNote(
    @Body() body: {
      userId: string;
      formId: string;
      formAnswers: Array<{ custom_module_id: string; answer: string }>;
    },
  ) {
    try {
      if (!body.userId || !body.formId || !body.formAnswers) {
        throw new HttpException(
          'User ID, Form ID, and Form Answers are required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const data = await this.healthieService.createChartNote(
        body.userId,
        body.formId,
        body.formAnswers,
      );
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to create chart note',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('chart-notes')
  async getChartNotes(@Query('fillerId') fillerId?: string, @Query('offset') offset?: string) {
    try {
      if (!fillerId) {
        throw new HttpException('Filler ID is required', HttpStatus.BAD_REQUEST);
      }

      const offsetNum = offset ? parseInt(offset, 10) : 0;
      const data = await this.healthieService.getChartNotes(fillerId, offsetNum);
      return data;
    } catch (error) {
      throw new HttpException(
        {
          error: 'Failed to fetch chart notes',
          message: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

