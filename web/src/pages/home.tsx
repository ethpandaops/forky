import Graph from '@components/Graph';
import Header from '@components/Header';
import Slider from '@components/Slider';

export default function Index() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1 relative flex-shrink-0">
        <Graph className="absolute inset-0 w-full h-full z-0" />
        <Header className="z-10" />
      </div>
      <footer className="bg-slate-50 p-6 flex-shrink-0 z-10">
        <Slider
          label="Current time"
          maxValue={720}
          step={1}
          numberFormatter={
            new Intl.NumberFormat('en-US', {
              style: 'decimal',
              maximumFractionDigits: 0,
            })
          }
        />
      </footer>
    </div>
  );
}
