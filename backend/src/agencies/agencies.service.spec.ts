import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgenciesService } from './agencies.service';
import { Agency } from './agency.entity';
import { CreateAgencyDto } from './dto/create-agency.dto';

describe('AgenciesService', () => {
  let service: AgenciesService;
  let agenciesRepository: Repository<Agency>;

  const mockAgency = {
    id: 1,
    name: 'Test Agency',
    users: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgenciesService,
        {
          provide: getRepositoryToken(Agency),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AgenciesService>(AgenciesService);
    agenciesRepository = module.get<Repository<Agency>>(getRepositoryToken(Agency));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all agencies', async () => {
      const mockAgencies = [mockAgency];
      jest.spyOn(agenciesRepository, 'find').mockResolvedValue(mockAgencies);

      const result = await service.findAll();

      expect(result).toEqual(mockAgencies);
      expect(agenciesRepository.find).toHaveBeenCalled();
    });

    it('should return empty array when no agencies exist', async () => {
      jest.spyOn(agenciesRepository, 'find').mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
      expect(agenciesRepository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return agency by id', async () => {
      jest.spyOn(agenciesRepository, 'findOne').mockResolvedValue(mockAgency);

      const result = await service.findOne(1);

      expect(result).toEqual(mockAgency);
      expect(agenciesRepository.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    });

    it('should return null when agency not found', async () => {
      jest.spyOn(agenciesRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
      expect(agenciesRepository.findOne).toHaveBeenCalledWith({ where: { id: 999 } });
    });
  });

  describe('create', () => {
    it('should create a new agency', async () => {
      const createDto: CreateAgencyDto = {
        name: 'New Agency',
      };

      jest.spyOn(agenciesRepository, 'create').mockReturnValue(mockAgency);
      jest.spyOn(agenciesRepository, 'save').mockResolvedValue(mockAgency);

      const result = await service.create(createDto);

      expect(result).toEqual(mockAgency);
      expect(agenciesRepository.create).toHaveBeenCalledWith(createDto);
      expect(agenciesRepository.save).toHaveBeenCalledWith(mockAgency);
    });

    it('should create agency with correct data', async () => {
      const createDto: CreateAgencyDto = {
        name: 'Another Agency',
      };

      const newAgency = { ...mockAgency, name: createDto.name };
      jest.spyOn(agenciesRepository, 'create').mockReturnValue(newAgency);
      jest.spyOn(agenciesRepository, 'save').mockResolvedValue(newAgency);

      const result = await service.create(createDto);

      expect(result.name).toBe(createDto.name);
      expect(agenciesRepository.create).toHaveBeenCalledWith(createDto);
      expect(agenciesRepository.save).toHaveBeenCalledWith(newAgency);
    });
  });
}); 