interface Items {
    name: string;
    Type: string;
    country: string;
    state: string;
    location: string;
    coordinates: {
        lat: number;
        long: number;
    };
    significance: string;
    description?: string;
    others?: string[];
}