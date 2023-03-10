import { IconType } from 'react-icons';
import { OperationCategory } from './operation-category';
import { MdPublic, MdStackedLineChart } from 'react-icons/md';
import { z } from 'zod';
import DifferentialLevelingDisplay from '../components/display/least-squares/differential-leveling';
import RadiiDisplay from '../components/display/geodetic/radii';

export const OperationSchema = z.union([
	z.literal('differential-leveling'),
	z.literal('horizontal-adjustment'),
	z.literal('3d-geodetic'),
	z.literal('solar-shot-reduction'),
	z.literal('star-shot-reduction'),
	z.literal('azimuth-reduction'),
	z.literal('predict-position'),
	z.literal('radii'),
	z.literal('geocentric-forwards'),
]);
export type Operation = z.infer<typeof OperationSchema>;

export interface OperationInfo {
	id: Operation;
	name: string;
	icon: IconType;
	display: (props: { data: any; results: any }) => JSX.Element;
}

export const operations: { [key in OperationCategory]: OperationInfo[] } = {
	'coordinate-computations': [
		{
			id: 'geocentric-forwards',
			name: 'Geocentric Forwards',
			icon: MdPublic,
			display: RadiiDisplay,
		},
	],
	'geodetic': [
		{
			id: 'radii',
			name: 'Radii',
			icon: MdPublic,
			display: RadiiDisplay,
		},
	],
	'least-squares': [
		{
			id: 'differential-leveling',
			name: 'Differential Leveling',
			icon: MdStackedLineChart,
			display: DifferentialLevelingDisplay,
		},
	],
};

export function categoryByOperation(
	op: Operation
): OperationCategory | undefined {
	for (let key in operations) {
		if (operations[key as OperationCategory].find(it => it.id === op))
			return key as OperationCategory;
	}
	return undefined;
}

export function operationName(op: Operation): string | undefined {
	for (let key in operations) {
		const find = operations[key as OperationCategory].find(it => it.id === op);
		if (find) return find.name;
	}
	return undefined;
}

export function operationInfo(op: Operation): OperationInfo | undefined {
	for (let key in operations) {
		const find = operations[key as OperationCategory].find(it => it.id === op);
		if (find) return find;
	}
	return undefined;
}

export const OperationHasWizard: { [key in Operation]: boolean } = {
	'geocentric-forwards': true,
	'differential-leveling': true,
	'radii': false,
	'3d-geodetic': false,
	'azimuth-reduction': false,
	'horizontal-adjustment': false,
	'predict-position': false,
	'solar-shot-reduction': false,
	'star-shot-reduction': false,
};
