import { Test, TestingModule } from '@nestjs/testing';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './agencies.service';
import { CreateAgencyDto } from './dto/create-agency.dto';

describe('AgenciesController', () => {
  let controller: AgenciesController;
  let service: AgenciesService;

  const mockAgency = {
    id: 1,
    name: 'Test Agency',
    address: 'Test Address',
    phone: '1234567890',
    email: 'agency@test.com',
  };

  const mockCreateAgencyDto: CreateAgencyDto = {
    name: 'New Agency',
    address: 'New Address',
    phone: '0987654321',
    email: 'new@agency.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgenciesController],
      providers: [
        {
          provide: AgenciesService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<AgenciesController>(AgenciesController);
    service = module.get<AgenciesService>(AgenciesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new agency', async () => {
      jest.spyOn(service, 'create').mockResolvedValue(mockAgency);

      const result = await controller.create(mockCreateAgencyDto);

      expect(result).toEqual(mockAgency);
      expect(service.create).toHaveBeenCalledWith(mockCreateAgencyDto);
    });
  });

  describe('findOne', () => {
    it('should return a single agency', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(mockAgency);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockAgency);
      expect(service.findOne).toHaveBeenCalledWith(1);
    });

    it('should return null when agency not found', async () => {
      jest.spyOn(service, 'findOne').mockResolvedValue(null);

      const result = await controller.findOne('999');

      expect(result).toBeNull();
    });
  });
}); 