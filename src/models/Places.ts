export enum HeritageType {
    ShaktiPeeth = 'Shakti Peeth',
    CharDham = 'Char Dham',
    ChotaCharDham = 'Chota Char Dham',
}

export enum TravelPlaceType {
  ReligiousSpiritual = "Religious / Spiritual Places",
  HistoricalHeritage = "Historical / Heritage Sites",
  AdventureTrekking = "Adventure / Trekking Destinations",
  BeachesCoastal = "Beaches / Coastal Areas",
  MountainsHillStations = "Mountains / Hill Stations",
  WildlifeNationalParks = "Wildlife / National Parks",
  CulturalEthnicVillages = "Cultural / Ethnic Villages",
  UrbanCityTourism = "Urban / City Tourism",
  WellnessYoga = "Wellness / Yoga Retreats",
  EcoSustainable = "Eco / Sustainable Tourism Spots",
  FestivalsEvents = "Festivals / Event Destinations",
  SeasonalClimateBased = "Seasonal / Climate-based Destinations"
}

export interface Place {
    name: string;
    type: string;
    country: string;
    state: string;
    city: string;
    coordinates: {
        lat: number;
        long: number;
    };
    heritage?: {
        unesco: boolean;
        national: boolean;
        state: boolean;
    };
    monsoonFriendly?: 'High' | 'Medium' | 'Low';
    bestVisitMonths?: string[];
    description?: string;
    others?: string[];
    images?: string[];
}
