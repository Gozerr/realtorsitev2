import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StatisticsService } from './statistics.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
  },
})
export class StatsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly statisticsService: StatisticsService) {}

  async handleConnection(client: Socket) {
    const stats = await this.statisticsService.getStatistics();
    client.emit('statsUpdate', stats);
  }

  broadcast(stats: any) {
    console.log('[GATEWAY] broadcast statsUpdate:', stats);
    this.server.emit('statsUpdate', stats);
  }
} 