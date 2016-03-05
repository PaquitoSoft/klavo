import React from 'react';
import Message from './message';

export default function LoadingMessage(props) {
	return (
		<Message
			messageClasses="loading-message"
			iconClasses="notched circle loading"
			message={props.message}
			subMessage={props.subMessage || ''}
		/>
	);
}
