import { sdkStats } from '$lib/sdk-stats';

/** Build-time only — keeps `thetowersdk/data` out of the docs client bundle. */
export function load() {
	return {
		chartableSeries: sdkStats.chartableSeries
	};
}
