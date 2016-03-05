import React from 'react';

// TODO This should be a message component not a loading message
export default function Message(props) {
	return (		
		<div className={`ui icon message loading-message ${props.messageClasses}`}>
			<i className={`icon ${props.iconClasses}`}></i>
			<div className="content">
				<div className="header">
					{props.message}
				</div>
				<p>{props.subMessage || ''}</p>
			</div>
		</div>
	);
}

Message.propTypes = {
	messageClasses: React.PropTypes.string.isRequired,
	iconClasses: React.PropTypes.string.isRequired,
	message: React.PropTypes.string.isRequired
};
