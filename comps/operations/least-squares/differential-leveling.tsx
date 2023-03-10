import {
	DifferentialLevelingData,
	DifferentialLevelingResults,
} from '../../../types/operation/least-squares/differential-leveling';
import { Matrix } from '../../matrix';
import { CheckIcon, WarningIcon, WarningTwoIcon } from '@chakra-ui/icons';
import { Icon, useColorModeValue } from '@chakra-ui/react';
import { FaSkullCrossbones } from 'react-icons/fa';

export default function AdjustDifferentialLeveling(
	data: DifferentialLevelingData
): DifferentialLevelingResults {
	const stationsNotBenchmarks = [
		...data.observations.map(x => x.to),
		...data.observations.map(x => x.from),
	]
		.filter(
			(x, i, a) =>
				a.indexOf(x) === i && !data.benchmarks.map(b => b.station).includes(x)
		)
		.sort();

	const A = new Matrix(
		data.observations.map(observation => {
			return stationsNotBenchmarks.map(station => {
				if (station === observation.from) {
					return -1;
				} else if (station === observation.to) {
					return 1;
				} else {
					return 0;
				}
			});
		})
	);

	const B = new Matrix([
		data.observations.map(observation => {
			if (data.benchmarks.find(x => x.station === observation.from)) {
				return -data.benchmarks.find(x => x.station === observation.from)!!
					.elevation;
			} else if (data.benchmarks.find(x => x.station === observation.to)) {
				return data.benchmarks.find(x => x.station === observation.to)!!
					.elevation;
			} else {
				return 0;
			}
		}),
	]).transpose;

	const preL = new Matrix([data.observations.map(x => x.deltaElevation)])
		.transpose;
	const L = preL.minus(B);

	let AT = A.transpose;

	let W = new Matrix([]);
	switch (data.weightingScheme) {
		case 'normal':
			W = Matrix.diagonal(data.observations.map(x => x.weight));
			break;
		case 'distance':
			const sumOfWeights = data.observations
				.map(x => x.weight)
				.reduce((a, b) => a + b);
			W = Matrix.diagonal(data.observations.map(x => x.weight / sumOfWeights));
			break;
		case 'stddev':
			W = Matrix.diagonal(
				data.observations.map(x => 1 / (x.weight * x.weight))
			);
			break;
	}
	if (data.weightingScheme !== 'unweighted') {
		AT = AT.times(W);
	}

	const N = AT.times(A);
	const NInv = N.inverse;
	const ATL = AT.times(L);
	const X = NInv.times(ATL);
	const V = A.times(X).minus(L);

	let referenceStdDev;
	if (data.weightingScheme === 'unweighted') {
		referenceStdDev = Math.sqrt(
			V.transpose.times(V).get(0, 0) /
				(data.observations.length - stationsNotBenchmarks.length)
		);
	} else {
		referenceStdDev = Math.sqrt(
			V.transpose.times(W).times(V).get(0, 0) /
				(data.observations.length - stationsNotBenchmarks.length)
		);
	}

	return {
		adjustedStations: [...stationsNotBenchmarks].map((station, i) => ({
			station: station,
			elevation: X.get(i, 0),
		})),
		referenceStdDev: isNaN(referenceStdDev) ? 0 : referenceStdDev,
		residuals: data.observations.map((observation, i) => ({
			from: observation.from,
			to: observation.to,
			residual: V.get(i, 0),
		})),
	};
}

export function InterpretRefStdDev(refStdDev: number): string {
	if (refStdDev <= 0.1) {
		return 'green';
	} else if (refStdDev <= 1) {
		return 'yellow';
	} else {
		return 'red';
	}
}

export function InterpretRefStdDevSymbol(props: { refStdDev: number }) {
	const green = useColorModeValue('green.800', 'green.200');
	const yellow = useColorModeValue('yellow.500', 'yellow.200');
	const red = useColorModeValue('red.800', 'red.200');
	if (props.refStdDev < 0.1) {
		return (
			<CheckIcon
				color={green}
				ml={2}
			/>
		);
	} else if (props.refStdDev < 1) {
		return (
			<WarningIcon
				color={yellow}
				ml={2}
			/>
		);
	} else if (props.refStdDev < 10) {
		return (
			<WarningTwoIcon
				color={red}
				ml={2}
			/>
		);
	} else {
		return (
			<Icon
				as={FaSkullCrossbones}
				color={red}
				ml={2}
			/>
		);
	}
}
