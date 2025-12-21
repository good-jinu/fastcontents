import type { Meta, StoryObj } from "@storybook/react-vite";
import type { FetchCallback } from "fastcontents";
import { FastContent } from "./FastContent";

interface MockContent {
	id: number;
	title: string;
	description: string;
	imageUrl?: string;
}

// Utility function to generate mock content
const generateMockContent = (startId: number, count: number): MockContent[] => {
	return Array.from({ length: count }, (_, i) => ({
		id: startId + i,
		title: `Content ${startId + i}`,
		description: `This is the description for content item ${startId + i}`,
		imageUrl: `https://picsum.photos/seed/${startId + i}/400/300`,
	}));
};

// Create a mock fetch callback with configurable behavior
const createMockFetch = (options: {
	totalItems?: number;
	itemsPerPage?: number;
	delay?: number;
	shouldFail?: boolean;
	failOnPage?: number;
}): FetchCallback<MockContent> => {
	const {
		totalItems = 100,
		itemsPerPage = 3,
		delay = 500,
		shouldFail = false,
		failOnPage,
	} = options;

	return async (params) => {
		const pageIndex = Math.floor(
			params.offset / (params.limit || itemsPerPage),
		);

		// Simulate network delay
		await new Promise((resolve) => setTimeout(resolve, delay));

		// Simulate error on specific page
		if (shouldFail || (failOnPage !== undefined && pageIndex === failOnPage)) {
			throw new Error("Failed to fetch content");
		}

		const startId = params.offset;
		const remainingItems = totalItems - params.offset;
		const itemCount = Math.min(params.limit || itemsPerPage, remainingItems);

		const items = generateMockContent(startId + 1, itemCount);
		const hasMore = params.offset + itemCount < totalItems;

		return {
			items,
			hasMore,
		};
	};
};

// Full-screen card renderer
const CardRenderer = ({
	content,
	index,
}: {
	content: MockContent;
	index: number;
}) => (
	<div
		style={{
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			height: "100%",
			padding: "40px",
			backgroundColor: "#fff",
			// Ensure it takes full size and doesn't shrink
			flex: "0 0 100%",
			boxSizing: "border-box"
		}}
	>
		<div
			style={{
				maxWidth: "600px",
				width: "100%",
				border: "1px solid #e0e0e0",
				borderRadius: "12px",
				overflow: "hidden",
				boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
			}}
		>
			<div
				style={{
					width: "100%",
					height: "300px",
					backgroundColor: `hsl(${(index * 30) % 360}, 70%, 80%)`,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "48px",
					fontWeight: "bold",
					color: "#fff",
				}}
			>
				{content.id}
			</div>
			<div style={{ padding: "24px" }}>
				<h2 style={{ margin: "0 0 12px 0", color: "#333" }}>{content.title}</h2>
				<p style={{ margin: "0 0 16px 0", color: "#666", lineHeight: "1.6" }}>
					{content.description}
				</p>
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<small style={{ color: "#999", fontSize: "14px" }}>
						Item #{content.id}
					</small>
					<small style={{ color: "#999", fontSize: "14px" }}>
						Position: {index}
					</small>
				</div>
			</div>
		</div>
	</div>
);

// Simple navigation controls
const SimpleControls = ({
	hasPrev,
	hasNext,
	onPrev,
	onNext,
	isLoading,
}: {
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	isLoading: boolean;
}) => (
	<div
		style={{
			position: "absolute",
			bottom: "20px",
			left: "50%",
			transform: "translateX(-50%)",
			display: "flex",
			gap: "12px",
			alignItems: "center",
		}}
	>
		<button
			type="button"
			onClick={onPrev}
			disabled={!hasPrev || isLoading}
			style={{
				padding: "12px 24px",
				fontSize: "16px",
				fontWeight: "600",
				border: "none",
				borderRadius: "8px",
				backgroundColor: hasPrev && !isLoading ? "#3498db" : "#ccc",
				color: "#fff",
				cursor: hasPrev && !isLoading ? "pointer" : "not-allowed",
				transition: "all 0.2s",
			}}
		>
			← Previous
		</button>
		<button
			type="button"
			onClick={onNext}
			disabled={!hasNext || isLoading}
			style={{
				padding: "12px 24px",
				fontSize: "16px",
				fontWeight: "600",
				border: "none",
				borderRadius: "8px",
				backgroundColor: hasNext && !isLoading ? "#3498db" : "#ccc",
				color: "#fff",
				cursor: hasNext && !isLoading ? "pointer" : "not-allowed",
				transition: "all 0.2s",
			}}
		>
			Next →
		</button>
		{isLoading && (
			<div
				style={{
					width: "20px",
					height: "20px",
					border: "3px solid #f3f3f3",
					borderTop: "3px solid #3498db",
					borderRadius: "50%",
					animation: "spin 1s linear infinite",
				}}
			/>
		)}
	</div>
);

// Fancy navigation with keyboard support
const FancyControls = ({
	hasPrev,
	hasNext,
	onPrev,
	onNext,
	isLoading,
}: {
	hasPrev: boolean;
	hasNext: boolean;
	onPrev: () => void;
	onNext: () => void;
	isLoading: boolean;
}) => {
	return (
		<>
			<style>
				{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
			</style>
			<div
				style={{
					position: "absolute",
					bottom: "40px",
					left: "50%",
					transform: "translateX(-50%)",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "16px",
				}}
			>
				<div
					style={{
						display: "flex",
						gap: "16px",
						alignItems: "center",
					}}
				>
					<button
						type="button"
						onClick={onPrev}
						disabled={!hasPrev || isLoading}
						style={{
							width: "60px",
							height: "60px",
							fontSize: "24px",
							border: "2px solid",
							borderColor: hasPrev && !isLoading ? "#3498db" : "#ccc",
							borderRadius: "50%",
							backgroundColor: "#fff",
							color: hasPrev && !isLoading ? "#3498db" : "#ccc",
							cursor: hasPrev && !isLoading ? "pointer" : "not-allowed",
							transition: "all 0.2s",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						←
					</button>
					<div
						style={{
							padding: "8px 16px",
							backgroundColor: "#f8f9fa",
							borderRadius: "20px",
							fontSize: "14px",
							color: "#666",
						}}
					>
						{isLoading ? "Loading..." : "Navigate"}
					</div>
					<button
						type="button"
						onClick={onNext}
						disabled={!hasNext || isLoading}
						style={{
							width: "60px",
							height: "60px",
							fontSize: "24px",
							border: "2px solid",
							borderColor: hasNext && !isLoading ? "#3498db" : "#ccc",
							borderRadius: "50%",
							backgroundColor: "#fff",
							color: hasNext && !isLoading ? "#3498db" : "#ccc",
							cursor: hasNext && !isLoading ? "pointer" : "not-allowed",
							transition: "all 0.2s",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						→
					</button>
				</div>
				<small style={{ color: "#999", fontSize: "12px" }}>
					Use arrow keys to navigate
				</small>
			</div>
		</>
	);
};

const meta: Meta<typeof FastContent> = {
	title: "Components/FastContent",
	component: FastContent,
	parameters: {
		layout: "fullscreen",
	},
	decorators: [
		(Story) => (
			<div
				style={{
					height: "100vh",
					backgroundColor: "#f5f5f5",
					overflow: "hidden", // Changed to hidden for swipe testing
				}}
			>
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof FastContent>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic navigation story
export const Basic: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 20, delay: 300 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			renderControls={SimpleControls}
		/>
	),
};

// With fancy controls
export const FancyNavigation: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 30, delay: 400 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			renderControls={FancyControls}
		/>
	),
};

// --- SWIPE STORIES ---

export const SwipeHorizontal: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 30, delay: 100 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			enableSwipe={true}
			orientation="horizontal"
			renderControls={SimpleControls} // Can still show controls
		/>
	),
};

export const SwipeVertical: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 30, delay: 100 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			enableSwipe={true}
			orientation="vertical"
			renderControls={SimpleControls}
		/>
	),
};

// Fast loading (no delay)
export const FastLoading: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 20, delay: 0 })}
			renderer={CardRenderer}
			initialBatchSize={5}
			batchSize={5}
			renderControls={SimpleControls}
		/>
	),
};

// Slow loading (simulates slow network)
export const SlowLoading: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 20, delay: 2000 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			renderControls={SimpleControls}
			fallback={
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						gap: "16px",
					}}
				>
					<div
						style={{
							width: "60px",
							height: "60px",
							border: "6px solid #f3f3f3",
							borderTop: "6px solid #3498db",
							borderRadius: "50%",
							animation: "spin 1s linear infinite",
						}}
					/>
					<h3 style={{ margin: 0, color: "#333" }}>Loading Content...</h3>
					<p style={{ margin: 0, color: "#666" }}>
						Please wait while we fetch your data
					</p>
				</div>
			}
		/>
	),
};

// Small buffer size
export const SmallBuffer: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({
				totalItems: 20,
				itemsPerPage: 2,
				delay: 300,
			})}
			renderer={CardRenderer}
			initialBatchSize={2}
			batchSize={2}
			renderControls={SimpleControls}
		/>
	),
};

// Large buffer size
export const LargeBuffer: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({
				totalItems: 50,
				itemsPerPage: 10,
				delay: 500,
			})}
			renderer={CardRenderer}
			initialBatchSize={10}
			batchSize={10}
			renderControls={FancyControls}
		/>
	),
};

// Limited content (only 5 items total)
export const LimitedContent: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 5, delay: 300 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			renderControls={SimpleControls}
		/>
	),
};

// Custom fallback UI
export const CustomFallback: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 20, delay: 1000 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
			renderControls={SimpleControls}
			fallback={
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						gap: "20px",
					}}
				>
					<div
						style={{
							width: "80px",
							height: "80px",
							border: "8px solid #f3f3f3",
							borderTop: "8px solid #3498db",
							borderRadius: "50%",
							animation: "spin 1s linear infinite",
						}}
					/>
					<h2 style={{ margin: 0, color: "#333" }}>
						Preparing Your Experience
					</h2>
					<p style={{ margin: 0, color: "#666", textAlign: "center" }}>
						We're loading amazing content for you...
					</p>
				</div>
			}
		/>
	),
};

// Minimal UI (no controls, just content)
export const MinimalUI: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 20, delay: 300 })}
			renderer={CardRenderer}
			initialBatchSize={3}
			batchSize={3}
		/>
	),
};

// Custom content renderer
export const CustomRenderer: Story = {
	render: () => (
		<FastContent
			fetchCallback={createMockFetch({ totalItems: 20, delay: 300 })}
			renderer={({ content, index }) => (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						height: "100%",
						padding: "20px",
					}}
				>
					<div
						style={{
							maxWidth: "800px",
							width: "100%",
							padding: "60px",
							backgroundColor: "#fff",
							borderRadius: "20px",
							boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
							textAlign: "center",
						}}
					>
						<div
							style={{
								width: "120px",
								height: "120px",
								margin: "0 auto 24px",
								backgroundColor: `hsl(${(index * 30) % 360}, 70%, 80%)`,
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: "48px",
								fontWeight: "bold",
								color: "#fff",
							}}
						>
							{content.id}
						</div>
						<h1
							style={{ margin: "0 0 16px 0", color: "#333", fontSize: "32px" }}
						>
							{content.title}
						</h1>
						<p
							style={{
								margin: "0 0 24px 0",
								color: "#666",
								fontSize: "18px",
								lineHeight: "1.6",
							}}
						>
							{content.description}
						</p>
						<div
							style={{
								display: "inline-block",
								padding: "8px 16px",
								backgroundColor: "#f0f0f0",
								borderRadius: "20px",
								fontSize: "14px",
								color: "#999",
							}}
						>
							Position: {index + 1}
						</div>
					</div>
				</div>
			)}
			initialBatchSize={3}
			batchSize={3}
			renderControls={FancyControls}
		/>
	),
};
