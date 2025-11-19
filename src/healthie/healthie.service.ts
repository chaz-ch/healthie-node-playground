import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class HealthieService {
  private readonly logger = new Logger(HealthieService.name);
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly healthieEnv: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('HEALTHIE_API_KEY');
    
    // Determine environment: use HEALTHIE_ENV if set, otherwise auto-detect from API key
    let healthieEnv = this.configService.get<string>('HEALTHIE_ENV')?.toLowerCase();
    if (!healthieEnv || (healthieEnv !== 'staging' && healthieEnv !== 'production')) {
      // Auto-detect: sandbox keys (starting with gh_sbox_) use staging
      const isSandboxKey = this.apiKey && this.apiKey.startsWith('gh_sbox_');
      healthieEnv = isSandboxKey ? 'staging' : 'production';
    }

    this.healthieEnv = healthieEnv;
    const isStaging = healthieEnv === 'staging';
    this.apiUrl = isStaging
      ? 'https://staging-api.gethealthie.com/graphql'
      : 'https://api.gethealthie.com/graphql';

    this.logger.log(`🌍 Healthie Environment: ${this.healthieEnv.toUpperCase()}`);
    this.logger.log(`📡 API URL: ${this.apiUrl}`);
  }

  private getUserQuery(userId: string): string {
    return `
      query {
        user(id: "${userId}") {
          id
          first_name
          last_name
          email
          phone_number
          dob
          gender
          location {
            line1
            line2
            city
            state
            zip
          }
        }
        conversationMemberships(provider_id: "${userId}") {
          conversation_id
          display_name
          convo {
            id
            name
            patient_id
            created_at
            updated_at
            last_message_content
            owner {
              id
              first_name
              last_name
            }
            invitees {
              id
              first_name
              last_name
            }
            notes {
              id
            }
          }
        }
      }
    `;
  }

  private getConversationQuery(conversationId: string): string {
    return `
      query {
        conversation(id: "${conversationId}") {
          id
          name
          created_at
          updated_at
          notes {
            id
            content
            created_at
            updated_at
            creator {
              id
              first_name
              last_name
            }
          }
        }
      }
    `;
  }

  private getCreateNoteMutation(conversationId: string, content: string, userId: string): string {
    return `
      mutation {
        createNote(input: {
          conversation_id: "${conversationId}"
          content: "${content}"
          user_id: "${userId}"
        }) {
          messages {
            field
            message
          }
          note {
            id
            content
            created_at
            updated_at
            creator {
              id
              first_name
              last_name
            }
          }
        }
      }
    `;
  }

  private getUsersListQuery(offset: number = 0, keywords: string = ''): string {
    const keywordsParam = keywords ? `, keywords: "${keywords}"` : '';
    return `
      query {
        users(offset: ${offset}, should_paginate: true, active_status: "active"${keywordsParam}) {
          id
          first_name
          last_name
          email
          phone_number
        }
      }
    `;
  }

  private getCreateConversationMutation(clinicianId: string, patientId: string, name?: string): string {
    const nameParam = name ? `name: "${name}"` : '';
    // Use simple_added_users to add the patient as a participant
    // Format: "user-{id}" where id is the user's ID
    const simpleAddedUsers = `user-${patientId}`;
    return `
      mutation {
        createConversation(input: {
          owner_id: "${clinicianId}"
          simple_added_users: "${simpleAddedUsers}"
          ${nameParam}
        }) {
          conversation {
            id
            name
            created_at
            patient_id
            owner {
              id
              first_name
              last_name
            }
            invitees {
              id
              first_name
              last_name
            }
          }
          messages {
            field
            message
          }
        }
      }
    `;
  }

  private getWebSocketUrl(): string {
    const isStaging = this.healthieEnv === 'staging';
    const wsBaseUrl = isStaging
      ? 'wss://ws.staging.gethealthie.com/subscriptions'
      : 'wss://ws.gethealthie.com/subscriptions';
    return `${wsBaseUrl}?token=${this.apiKey}`;
  }

  async getUserData(userId: string) {
    try {
      const response = await axios.post(
        this.apiUrl,
        { query: this.getUserQuery(userId) },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'AuthorizationSource': 'API',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.errors) {
        this.logger.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error('Error fetching user data');
      }

      this.logger.log('User API Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } catch (error) {
      this.logger.error('Error fetching user data:', error.message);
      throw error;
    }
  }

  async getConversationData(conversationId: string) {
    try {
      const response = await axios.post(
        this.apiUrl,
        { query: this.getConversationQuery(conversationId) },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'AuthorizationSource': 'API',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.errors) {
        this.logger.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error('Error fetching conversation data');
      }

      this.logger.log('Conversation API Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } catch (error) {
      this.logger.error('Error fetching conversation data:', error.message);
      throw error;
    }
  }

  async createNote(conversationId: string, content: string, userId: string) {
    try {
      const response = await axios.post(
        this.apiUrl,
        { query: this.getCreateNoteMutation(conversationId, content, userId) },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'AuthorizationSource': 'API',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.errors) {
        this.logger.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error('Error creating note');
      }

      this.logger.log('Create Note Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } catch (error) {
      this.logger.error('Error creating note:', error.message);
      throw error;
    }
  }

  async getUsers(offset: number = 0, keywords: string = '') {
    try {
      const response = await axios.post(
        this.apiUrl,
        { query: this.getUsersListQuery(offset, keywords) },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'AuthorizationSource': 'API',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.errors) {
        this.logger.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error('Error fetching users list');
      }

      this.logger.log('Users List Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } catch (error) {
      this.logger.error('Error fetching users list:', error.message);
      throw error;
    }
  }

  async createConversation(clinicianId: string, patientId: string, name?: string) {
    try {
      const response = await axios.post(
        this.apiUrl,
        { query: this.getCreateConversationMutation(clinicianId, patientId, name) },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'AuthorizationSource': 'API',
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.errors) {
        this.logger.error('GraphQL Errors:', JSON.stringify(response.data.errors, null, 2));
        throw new Error('Error creating conversation');
      }

      this.logger.log('Create Conversation Response:', JSON.stringify(response.data.data, null, 2));
      return response.data.data;
    } catch (error) {
      this.logger.error('Error creating conversation:', error.message);
      throw error;
    }
  }

  getWebSocketUrlForClient(): { wsUrl: string } {
    return { wsUrl: this.getWebSocketUrl() };
  }
}

