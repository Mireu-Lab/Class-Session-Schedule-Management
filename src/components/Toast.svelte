<script lang="ts">
  import { onDestroy } from 'svelte';
  import { 
  AlertTriangle, Archive, CheckCircle, FileText, Trash2, 
  FileSpreadsheet, Image as ImageIcon, Info, FileDown, PlusCircle, X, Check, MoveVertical
} from 'lucide-svelte';

  let { message = '', iconName = '', visible = false, onClose } = $props();

  let offset = $state({ x: 0, y: 0 });
  let isDragging = $state(false);
  let dragStart = { x: 0, y: 0 };
  let timerRef: any = null;

  function startTimer() {
    if (timerRef) clearTimeout(timerRef);
    timerRef = setTimeout(() => {
      onClose();
    }, 3000);
  }

  $effect(() => {
    if (visible) {
      offset = { x: 0, y: 0 };
      isDragging = false;
      startTimer();
    }
  });

  onDestroy(() => {
    if (timerRef) clearTimeout(timerRef);
  });

  function handlePointerDown(e: PointerEvent) {
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    isDragging = true;
    dragStart = { x: e.clientX, y: e.clientY };
    if (timerRef) {
      clearTimeout(timerRef);
      timerRef = null;
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    offset = { x: dx, y: dy };
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isDragging) return;
    isDragging = false;
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);

    const threshold = 80;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
      onClose();
    } else {
      offset = { x: 0, y: 0 };
      startTimer();
    }
  }

    const iconMap: Record<string, any> = {
    AlertTriangle, Archive, CheckCircle, FileText, Trash2, 
    FileSpreadsheet, ImageIcon, Info, FileDown, PlusCircle, X,
    'check': Check,
    'move': MoveVertical
  };
  let IconComponent = $derived(iconMap[iconName] || Info);
</script>

<div
  class="fixed top-6 left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-6 z-[100] w-[90%] sm:w-auto transition-all duration-300 {
    visible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-12 opacity-0 pointer-events-none'
  }"
>
  <div role="presentation"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={() => {
      isDragging = false;
      offset = { x: 0, y: 0 };
      startTimer();
    }}
    style:transform="translate3d({offset.x}px, {offset.y}px, 0)"
    style:touch-action="none"
    class="bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl text-xs flex items-center gap-2.5 cursor-grab active:cursor-grabbing select-none w-full sm:w-auto {
      isDragging ? '' : 'transition-transform duration-300'
    }"
  >
    <IconComponent class="w-4.5 h-4.5 text-indigo-400 shrink-0 pointer-events-none" />
    <span class="font-semibold pointer-events-none">{message}</span>
  </div>
</div>
