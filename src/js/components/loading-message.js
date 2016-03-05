import React from 'react';

// TODO This should be a message component not a loading message
export default function LoadingMessage(props) {
	return (
		<div className="ui icon message loading-message">
			<i className="notched circle loading icon"></i>
			<div className="content">
				<div className="header">
					{props.message}
				</div>
				<p>{props.subMessage || ''}</p>
			</div>
		</div>
	);
}