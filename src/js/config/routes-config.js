import HomePage from '../components/home-page';
import MovieDetailPage from '../components/movie-detail-page';

export default Object.freeze({
	'/': HomePage,
	'/movies/:section': HomePage,
	'/movie/:cpId': MovieDetailPage
});
