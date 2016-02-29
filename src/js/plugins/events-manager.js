import EventsEmitter from 'events';

class EventsManager extends EventsEmitter {

	// TODO Show a warning in console if eventName provided does not exists in constants plugin

	/* The on(eventName, listener) function is inherited from the EventsEmitter */

	off(eventName, listener) {
		this.removeListener(eventName, listener);
	}

	trigger(eventName, data) {
		this.emit(eventName, data);
	}

}

let singleton = new EventsManager();
export default singleton;
