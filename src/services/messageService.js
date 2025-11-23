import apiService from '../utils/api';

const messageService = {
  async getRecipients() {
    const resp = await apiService.get('/api/messages/recipients');
    return resp ?? [];
  },
  async getConversations() {
    const resp = await apiService.get('/api/messages/conversations');
    return resp ?? [];
  },
  async getConversationMessages(conversationKey) {
    if (!conversationKey) return { messages: [] };
    const resp = await apiService.get(`/api/messages/conversations/${encodeURIComponent(conversationKey)}`);
    return resp || { messages: [] };
  },
  async sendMessage(payload) {
    return apiService.post('/api/messages/send', payload);
  },
};

export default messageService;
