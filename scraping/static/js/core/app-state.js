import { CONFIG } from './config.js';

// ===== MANEJO DE ESTADO GLOBAL =====
class AppState {
    constructor() {
        this.state = {
            isLoading: false,
            filters: new Map(),
            currentPage: 1,
            scrollPosition: 0,
            pendingRequests: new Set()
        };
        
        this.listeners = new Map();
        this.debounceTimers = new Map();
    }
    
    set(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;
        this.notify(key, value, oldValue);
    }
    
    get(key) {
        return this.state[key];
    }
    
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        // Retornar función para desuscribirse
        return () => {
            this.listeners.get(key)?.delete(callback);
        };
    }
    
    notify(key, newValue, oldValue) {
        this.listeners.get(key)?.forEach(callback => {
            try {
                callback(newValue, oldValue);
            } catch (error) {
                console.error(`Error in listener for ${key}:`, error);
            }
        });
    }
    
    debounce(key, callback, delay = CONFIG.SEARCH_DEBOUNCE) {
        clearTimeout(this.debounceTimers.get(key));
        this.debounceTimers.set(key, setTimeout(callback, delay));
    }
    
    addPendingRequest(requestId) {
        this.state.pendingRequests.add(requestId);
        this.set('isLoading', this.state.pendingRequests.size > 0);
    }
    
    removePendingRequest(requestId) {
        this.state.pendingRequests.delete(requestId);
        this.set('isLoading', this.state.pendingRequests.size > 0);
    }
}

const appState = new AppState();

export { appState, AppState };