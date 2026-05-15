// AutoGuard - Local Database (db.file simulator using localStorage)
// Bu fayl db.file o'rnida ishlatiladi - barcha ma'lumotlar shu yerda saqlanadi

const DB_NAME = 'autoguard.db';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  authMethod: 'google' | 'apple' | 'phone';
  jshirOrPassport?: string;
  faceVerified: boolean;
  faceData?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  plateNumber: string;
  color: string;
  vinNumber: string;
  cameraId?: string;
  gpsId?: string;
  status: 'active' | 'parked' | 'stolen' | 'alert';
  lastLocation?: Location;
  createdAt: string;
}

export interface Location {
  lat: number;
  lng: number;
  address: string;
  timestamp: string;
}

export interface Person {
  id: string;
  sessionId: string;
  vehicleId: string;
  seatPosition: string;
  relation: 'family' | 'friend' | 'stranger';
  faceImage?: string;
  faceId?: string;
  isKnown: boolean;
  timestamp: string;
}

export interface TripSession {
  id: string;
  vehicleId: string;
  userId: string;
  startTime: string;
  endTime?: string;
  startLocation: Location;
  endLocation?: Location;
  route: Location[];
  persons: Person[];
  engineAuthorized: boolean;
  authDelay?: number;
  status: 'active' | 'completed';
  videoPath?: string;
  alertType?: 'weapon_detected' | 'unauthorized_start' | 'theft';
}

export interface Alert {
  id: string;
  vehicleId: string;
  userId: string;
  type: 'weapon_detected' | 'unauthorized_start' | 'theft' | 'stranger_detected';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location?: Location;
  images?: string[];
  resolved: boolean;
  userAction?: 'sos' | 'self_handle';
  timestamp: string;
}

export interface Settings {
  userId: string;
  cameraQuality: '720p' | '1080p' | '4K';
  gpsEnabled: boolean;
  microphoneEnabled: boolean;
  videoSaveEnabled: boolean;
  notificationsEnabled: boolean;
  autoCallPolice: boolean;
  locationUpdateInterval: number;
}

export interface KnownFace {
  id: string;
  userId: string;
  personId: string;
  relation: 'family' | 'friend' | 'stranger';
  name?: string;
  faceDescriptor: string;
  faceImage?: string;
  firstSeen: string;
  lastSeen: string;
  seenCount: number;
}

// DB Helper functions
class AutoGuardDB {
  private prefix: string;

  constructor() {
    this.prefix = DB_NAME;
    this.init();
  }

  private init() {
    if (!localStorage.getItem(`${this.prefix}:initialized`)) {
      localStorage.setItem(`${this.prefix}:initialized`, 'true');
      localStorage.setItem(`${this.prefix}:users`, JSON.stringify([]));
      localStorage.setItem(`${this.prefix}:vehicles`, JSON.stringify([]));
      localStorage.setItem(`${this.prefix}:trips`, JSON.stringify([]));
      localStorage.setItem(`${this.prefix}:alerts`, JSON.stringify([]));
      localStorage.setItem(`${this.prefix}:faces`, JSON.stringify([]));
      localStorage.setItem(`${this.prefix}:settings`, JSON.stringify([]));
      localStorage.setItem(`${this.prefix}:persons`, JSON.stringify([]));
    }
  }

  private getData<T>(table: string): T[] {
    const data = localStorage.getItem(`${this.prefix}:${table}`);
    return data ? JSON.parse(data) : [];
  }

  private setData<T>(table: string, data: T[]): void {
    localStorage.setItem(`${this.prefix}:${table}`, JSON.stringify(data));
  }

  generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Users
  getUsers(): User[] { return this.getData<User>('users'); }
  getUserById(id: string): User | undefined { return this.getUsers().find(u => u.id === id); }
  getUserByEmail(email: string): User | undefined { return this.getUsers().find(u => u.email === email); }
  getUserByPhone(phone: string): User | undefined { return this.getUsers().find(u => u.phone === phone); }
  getUserByJshir(jshir: string): User | undefined { return this.getUsers().find(u => u.jshirOrPassport === jshir); }
  
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const users = this.getUsers();
    users.push(newUser);
    this.setData('users', users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.setData('users', users);
    return users[idx];
  }

  // Vehicles
  getVehicles(): Vehicle[] { return this.getData<Vehicle>('vehicles'); }
  getVehiclesByUserId(userId: string): Vehicle[] { return this.getVehicles().filter(v => v.userId === userId); }
  getVehicleById(id: string): Vehicle | undefined { return this.getVehicles().find(v => v.id === id); }

  createVehicle(vehicle: Omit<Vehicle, 'id' | 'createdAt'>): Vehicle {
    const newVehicle: Vehicle = {
      ...vehicle,
      id: this.generateId(),
      createdAt: new Date().toISOString()
    };
    const vehicles = this.getVehicles();
    vehicles.push(newVehicle);
    this.setData('vehicles', vehicles);
    return newVehicle;
  }

  updateVehicle(id: string, updates: Partial<Vehicle>): Vehicle | null {
    const vehicles = this.getVehicles();
    const idx = vehicles.findIndex(v => v.id === id);
    if (idx === -1) return null;
    vehicles[idx] = { ...vehicles[idx], ...updates };
    this.setData('vehicles', vehicles);
    return vehicles[idx];
  }

  deleteVehicle(id: string): boolean {
    const vehicles = this.getVehicles().filter(v => v.id !== id);
    this.setData('vehicles', vehicles);
    return true;
  }

  // Trips
  getTrips(): TripSession[] { return this.getData<TripSession>('trips'); }
  getTripsByVehicleId(vehicleId: string): TripSession[] { return this.getTrips().filter(t => t.vehicleId === vehicleId); }
  getActiveTripByVehicleId(vehicleId: string): TripSession | undefined {
    return this.getTrips().find(t => t.vehicleId === vehicleId && t.status === 'active');
  }

  createTrip(trip: Omit<TripSession, 'id'>): TripSession {
    const newTrip: TripSession = { ...trip, id: this.generateId() };
    const trips = this.getTrips();
    trips.push(newTrip);
    this.setData('trips', trips);
    return newTrip;
  }

  updateTrip(id: string, updates: Partial<TripSession>): TripSession | null {
    const trips = this.getTrips();
    const idx = trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    trips[idx] = { ...trips[idx], ...updates };
    this.setData('trips', trips);
    return trips[idx];
  }

  // Alerts
  getAlerts(): Alert[] { return this.getData<Alert>('alerts'); }
  getAlertsByUserId(userId: string): Alert[] { return this.getAlerts().filter(a => a.userId === userId); }
  getUnresolvedAlerts(userId: string): Alert[] { return this.getAlertsByUserId(userId).filter(a => !a.resolved); }

  createAlert(alert: Omit<Alert, 'id' | 'timestamp'>): Alert {
    const newAlert: Alert = {
      ...alert,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };
    const alerts = this.getAlerts();
    alerts.push(newAlert);
    this.setData('alerts', alerts);
    return newAlert;
  }

  updateAlert(id: string, updates: Partial<Alert>): Alert | null {
    const alerts = this.getAlerts();
    const idx = alerts.findIndex(a => a.id === id);
    if (idx === -1) return null;
    alerts[idx] = { ...alerts[idx], ...updates };
    this.setData('alerts', alerts);
    return alerts[idx];
  }

  // Known Faces
  getKnownFaces(): KnownFace[] { return this.getData<KnownFace>('faces'); }
  getKnownFacesByUserId(userId: string): KnownFace[] { return this.getKnownFaces().filter(f => f.userId === userId); }

  saveFace(face: Omit<KnownFace, 'id'>): KnownFace {
    const newFace: KnownFace = { ...face, id: this.generateId() };
    const faces = this.getKnownFaces();
    faces.push(newFace);
    this.setData('faces', faces);
    return newFace;
  }

  updateFace(id: string, updates: Partial<KnownFace>): KnownFace | null {
    const faces = this.getKnownFaces();
    const idx = faces.findIndex(f => f.id === id);
    if (idx === -1) return null;
    faces[idx] = { ...faces[idx], ...updates };
    this.setData('faces', faces);
    return faces[idx];
  }

  // Settings
  getSettings(): Settings[] { return this.getData<Settings>('settings'); }
  getSettingsByUserId(userId: string): Settings | undefined { return this.getSettings().find(s => s.userId === userId); }

  saveSettings(settings: Settings): void {
    const allSettings = this.getSettings();
    const idx = allSettings.findIndex(s => s.userId === settings.userId);
    if (idx === -1) {
      allSettings.push(settings);
    } else {
      allSettings[idx] = settings;
    }
    this.setData('settings', allSettings);
  }

  // Persons
  getPersons(): Person[] { return this.getData<Person>('persons'); }
  getPersonsBySessionId(sessionId: string): Person[] { return this.getPersons().filter(p => p.sessionId === sessionId); }

  savePerson(person: Omit<Person, 'id'>): Person {
    const newPerson: Person = { ...person, id: this.generateId() };
    const persons = this.getPersons();
    persons.push(newPerson);
    this.setData('persons', persons);
    return newPerson;
  }

  // Current User Session
  getCurrentUser(): User | null {
    const userId = sessionStorage.getItem(`${this.prefix}:currentUser`);
    if (!userId) return null;
    return this.getUserById(userId) || null;
  }

  setCurrentUser(userId: string): void {
    sessionStorage.setItem(`${this.prefix}:currentUser`, userId);
  }

  clearCurrentUser(): void {
    sessionStorage.removeItem(`${this.prefix}:currentUser`);
  }

  // Statistics
  getStats(userId: string) {
    const vehicles = this.getVehiclesByUserId(userId);
    const alerts = this.getAlertsByUserId(userId);
    const trips = vehicles.flatMap(v => this.getTripsByVehicleId(v.id));
    return {
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter(v => v.status === 'active').length,
      totalAlerts: alerts.length,
      unresolvedAlerts: alerts.filter(a => !a.resolved).length,
      totalTrips: trips.length,
      totalDistance: (trips.length * 15.3).toFixed(1)
    };
  }
}

export const db = new AutoGuardDB();
export default db;
