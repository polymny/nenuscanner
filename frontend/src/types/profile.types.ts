export interface Profile {
  id: number;
  name: string;
  ownerName: string | null;
  employer: string | null;
  contact: string | null;
  project: string | null;
  isActive: boolean;
}
