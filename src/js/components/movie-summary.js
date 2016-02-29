import React from 'react';

export default function MovieSummary(props) {
	let movie = props.movie;
	return (
		<div className="card movie-summary">
			<div className="image">
				<img src={movie.posterUrl} alt={movie.title} />
			</div>
			<div className="content">
				<div className="header">{movie.title}</div>
				<div className="meta">
					<a href="#">{movie.genre}</a>
				</div>
				<div className="description">
				</div>
			</div>
			<div className="extra content">
				<span className="right floated">{movie.year}</span>
				<span>{movie.quality}</span>
			</div>
		</div>
	);	
}
