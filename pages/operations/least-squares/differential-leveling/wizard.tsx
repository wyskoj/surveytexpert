import CommonPage from '../../../../components/common-page';
import {
	Badge,
	Button,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	HStack,
	Input,
	Radio,
	RadioGroup,
	Spinner,
	Stack,
	useToast,
	VStack,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { useState } from 'react';
import {
	DifferentialLevelingData,
	DifferentialLevelingObservation,
	DifferentialLevelingObservationSchema,
	DifferentialLevelingResultsSchema,
	StationElevation,
	StationElevationSchema,
	WeightingScheme,
	WeightingSchemeDescription,
	WeightingSchemeSchema,
} from '../../../../types/operation/least-squares/differential-leveling';
import DataEntryTable from '../../../../components/data-entry-table';
import router from 'next/router';
import useLocalStorage from '../../../../hooks/use-local-storage';
import {
	OperationInstance,
	OperationInstanceSchema,
} from '../../../../types/operation-instance';
import { z } from 'zod';
import { v4 as uuid } from 'uuid';
import {
	BenchmarkHelp,
	ObservationHelp,
	WeightingSchemeHelp,
} from '../../../../components/help/least-squares/differential-leveling';
import AdjustDifferentialLeveling from '../../../../comps/operations/least-squares/differential-leveling';

export default function DifferentialLevelingWizard() {
	const [instances, setInstances] = useLocalStorage<OperationInstance[]>(
		'instances',
		z.array(OperationInstanceSchema)
	);
	const [title, setTitle] = useState('');
	const [weightingScheme, setWeightingScheme] =
		useState<WeightingScheme>('unweighted');
	const [benchmarks, setBenchmarks] = useState<StationElevation[]>([]);
	const [observations, setObservations] = useState<
		DifferentialLevelingObservation[]
	>([]);
	const [waiting, setWaiting] = useState(false);
	const toast = useToast();

	function buildPayload(): DifferentialLevelingData {
		return {
			weightingScheme,
			benchmarks,
			observations,
		};
	}

	function submit() {
		setWaiting(true);
		const payload = buildPayload();
		const results = AdjustDifferentialLeveling(payload);
		const instance: OperationInstance = {
			data: payload,
			id: uuid(),
			name: title.trim(),
			operation: 'differential-leveling',
			result: results,
			timestamp: new Date().valueOf(),
			new: true,
		};
		setInstances([...(instances ?? []), instance]);
		router.push('/dashboard');
	}

	return (
		<CommonPage
			title={'Differential Leveling'}
			description={
				'This operation performs a least-squares adjustment on a differential leveling dataset.'
			}
		>
			<>
				<VStack spacing={8}>
					{/* Title */}
					<FormControl>
						<FormLabel>
							<Badge mr={2}>1</Badge>Title
						</FormLabel>
						<Input
							type={'text'}
							value={title}
							onChange={e => setTitle(e.target.value)}
						/>
						<FormHelperText>
							Use a name that uniquely identifies this operation.
						</FormHelperText>
						<FormErrorMessage>Title is required.</FormErrorMessage>
					</FormControl>
					{/* Weighting Scheme */}
					<FormControl>
						<FormLabel>
							<Badge mr={2}>2</Badge>Weighting scheme
							<WeightingSchemeHelp />
						</FormLabel>
						<RadioGroup
							defaultValue="unweighted"
							onChange={nextValue => {
								try {
									setWeightingScheme(WeightingSchemeSchema.parse(nextValue));
								} catch (e) {
									console.warn('Attempt to set weighting scheme failed.', e);
								}
							}}
							value={weightingScheme}
						>
							<Stack direction={['column', 'column', 'row']}>
								<Radio value="unweighted">Unweighted</Radio>
								<Radio value="normal">Normal</Radio>
								<Radio value="distance">Distances</Radio>
								<Radio value="stddev">Standard deviations</Radio>
							</Stack>
						</RadioGroup>
						<FormHelperText>
							{WeightingSchemeDescription[weightingScheme]}
						</FormHelperText>
					</FormControl>
					{/* Benchmarks */}
					<FormControl>
						<FormLabel>
							<Badge mr={2}>3</Badge>Benchmarks
							<BenchmarkHelp />
						</FormLabel>
						<DataEntryTable<StationElevation>
							schema={StationElevationSchema}
							rows={benchmarks}
							setRows={setBenchmarks}
							validation={(data, rows) => {
								return {
									station: rows.some(it => it.station === data.station)
										? 'Station name must be unique.'
										: null,
									elevation: null,
								};
							}}
							transform={{
								station: data => {
									return data.trim();
								},
								elevation: data => {
									return data;
								},
							}}
							helperText={'Enter stations with known elevations.'}
						/>
					</FormControl>
					{/* Observations */}
					<FormControl>
						<FormLabel>
							<Badge mr={2}>4</Badge>Observations
							<ObservationHelp />
						</FormLabel>
						<DataEntryTable<DifferentialLevelingObservation>
							rows={observations}
							setRows={setObservations}
							schema={DifferentialLevelingObservationSchema}
							validation={data => {
								if (data.from === data.to) {
									return {
										from: 'From and to stations must be different.',
										to: 'From and to stations must be different.',
										deltaElevation: null,
										weight: null,
									};
								}
								return {
									from: null,
									to: null,
									deltaElevation: null,
									weight: null,
								};
							}}
							transform={{
								from: data => {
									return data.trim();
								},
								to: data => {
									return data.trim();
								},
								deltaElevation: data => {
									return data;
								},
								weight: data => {
									return data;
								},
							}}
							helperText={
								'Enter observations—a difference in elevation between two stations.'
							}
							customNames={{
								from: 'From',
								to: 'To',
								deltaElevation: 'Δ Elevation',
								weight: 'Weight',
							}}
							hideFields={
								weightingScheme === 'unweighted' ? ['weight'] : undefined
							}
						/>
					</FormControl>
					{/*<FormControl>*/}
					{/*	<FormLabel>*/}
					{/*		<Badge mr={2}>5</Badge>Options*/}
					{/*	</FormLabel>*/}
					{/*	<VStack align={'start'}>*/}
					{/*		<Box>*/}
					{/*			<Checkbox>Adjust control stations</Checkbox>*/}
					{/*		</Box>*/}
					{/*		<Box>*/}
					{/*			<Checkbox>Compute adjusted observational errors</Checkbox>*/}
					{/*		</Box>*/}
					{/*		<Box>*/}
					{/*			<Checkbox>Perform data snooping</Checkbox>*/}
					{/*		</Box>*/}
					{/*	</VStack>*/}
					{/*</FormControl>*/}
					<FormControl>
						<Button
							leftIcon={waiting ? <Spinner size={'sm'} /> : <CheckIcon />}
							isDisabled={
								!title.length ||
								!benchmarks.length ||
								!observations.length ||
								waiting
							}
							onClick={submit}
						>
							Submit
						</Button>
					</FormControl>
				</VStack>
			</>
		</CommonPage>
	);
}
