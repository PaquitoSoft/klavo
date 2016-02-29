import EventsEmitter from 'events';

class EventsManager extends EventsEmitter {

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
