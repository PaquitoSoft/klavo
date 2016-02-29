import EventsEmitter from 'events';

class EventsManager extends EventsEmitter {

	/*on(eventName, listener) {
		this.on(eventName, listener);
	}*/

	off(eventName, listener) {
		this.removeListener(eventName, listener);
	}

	trigger(eventName, data) {
		this.emit(eventName, data);
	}

	// References:
	//	https://googlechrome.github.io/samples/service-worker/post-message/
	//	http://craig-russell.co.uk/2016/01/29/service-worker-messaging.html#.VtNjpZPhCi4
	sendEventToSW(eventName) {
		if ('serviceWorker' in navigator) {
			return new Promise((resolve, reject) => {
				let messageChannel = new MessageChannel();
				messageChannel.port1.onmessage = function(event) {
					if (event.data.error) {
						reject(event.data.error);
					} else {
						resolve(event.data);
					}
				};

				navigator.serviceWorker.controller.postMessage(eventName, [messageChannel.port2]);
			});
		} else {
			return Promise.resolve(null);
		}
	}	
}

let singleton = new EventsManager();
export default singleton;
