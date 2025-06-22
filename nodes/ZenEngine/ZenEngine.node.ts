import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeConnectionType, NodeOperationError } from 'n8n-workflow';
import { ZenEngine as ZenEngineLib } from '@gorules/zen-engine';

export class ZenEngine implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Zen Engine',
		name: 'zenEngine',
		group: ['execution'],
		version: 1,
		description: 'Executes rules using the Zen Engine (GoRules)',
		defaults: {
			name: 'Zen Engine',
		},
		inputs: [NodeConnectionType.Main],
		outputs: [NodeConnectionType.Main],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Rules',
				name: 'rules',
				type: 'json',
				default: '',
				placeholder: '',
				description: 'Definition of rules in JSON format (JDM)',
			},
			{
				displayName: 'Input Data',
				name: 'input',
				type: 'json',
				default: '',
				placeholder: '',
				description: 'Input data to run against the rules',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getNodeInputs();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const rulesParam = this.getNodeParameter('rules', itemIndex, '') as string;
				const inputParam = this.getNodeParameter('input', itemIndex, '') as string;

				let rules: any = rulesParam;
				let input: any = inputParam;
				if (typeof rulesParam === 'string') {
					rules = JSON.parse(rulesParam);
				}
				if (typeof inputParam === 'string') {
					input = JSON.parse(inputParam);
				}

				const engine = new ZenEngineLib();
				const decision = engine.createDecision(rules);
				const result = await decision.evaluate(input);
				engine.dispose();

				returnData.push({ json: { ...result.result } });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({ json: { error: error.message || error.toString() }, pairedItem: itemIndex });
				} else {
					throw new NodeOperationError(this.getNode(), error, { itemIndex });
				}
			}
		}

		return [returnData];
	}
}
