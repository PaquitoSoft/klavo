import React from 'react';

export default function MovieSummary(props) {
	let movie = props.movie;
	return (
		<div className="card movie-summary">
			<div className="image">
				<a href={`/movie/${movie.cpId}`}>
					<img src={movie.coverUrl} alt={movie.title} />
				</a>
			</div>
			<div className="content movie-info">
				<div className="header">
					<a href={`/movie/${movie.cpId}`}>{movie.title}</a>
				</div>
				<div className="meta">
					<span>{movie.genre}</span>
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
