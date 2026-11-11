"""Database seed script populating demo user, subjects, and study decks.

Creates:
- Demo user (demo@example.com / demopassword123)
- Subjects: Operating Systems (15 QA items), Computer Networks (15 QA items), Data Structures & Algorithms (8 Problems)
- Scoped tags and user_items review scheduling records
- Safe to run multiple times (idempotent)
"""

from datetime import date, datetime, timedelta, timezone
import os
from pathlib import Path
import sys

# Ensure backend root is on sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from sqlalchemy import func
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.item import Item
from app.models.review import ReviewLog, UserItem
from app.models.subject import Subject
from app.models.tag import Tag
from app.models.user import User

DEMO_EMAIL = "demo@example.com"
DEMO_PASSWORD = "demopassword123"

# 15 Operating Systems Q&A items
OS_DECK = [
    {
        "title": "Process vs Thread",
        "prompt": "What is the primary architectural difference between a process and a thread?",
        "answer": "A process has its own dedicated virtual address space and resources. Threads within the same process share that memory space and file descriptors, having only their own stack, registers, and program counter.",
        "tags": ["processes", "concurrency"],
    },
    {
        "title": "Virtual Memory & Paging",
        "prompt": "How does virtual memory provide memory protection and address translation?",
        "answer": "The MMU (Memory Management Unit) maps virtual addresses to physical frames using page tables. Invalid access bits trigger segmentation faults, isolating processes from each other and the kernel.",
        "tags": ["memory-management", "paging"],
    },
    {
        "title": "Page Fault Handling",
        "prompt": "What steps does the OS take when a page fault exception occurs?",
        "answer": "1. Trap to kernel mode. 2. Verify virtual address validity. 3. Allocate physical frame. 4. Initiate disk I/O to swap in page. 5. Update page table and valid bit. 6. Resume the faulting instruction.",
        "tags": ["memory-management", "paging"],
    },
    {
        "title": "Coffman Conditions for Deadlock",
        "prompt": "What are the four necessary and sufficient conditions for a system deadlock to occur?",
        "answer": "1. Mutual Exclusion. 2. Hold and Wait. 3. No Preemption. 4. Circular Wait.",
        "tags": ["concurrency", "deadlocks"],
    },
    {
        "title": "Mutex vs Counting Semaphore",
        "prompt": "How does a mutex differ from a counting semaphore?",
        "answer": "A mutex is a locking mechanism with ownership (only the thread that acquired the mutex can release it). A semaphore is a signaling mechanism with an integer counter where any thread can signal/post.",
        "tags": ["concurrency", "synchronization"],
    },
    {
        "title": "CPU Scheduling Algorithms",
        "prompt": "Compare Round Robin scheduling with Shortest Job First (SJF).",
        "answer": "SJF is provably optimal for minimizing average turnaround time but can cause starvation for long jobs. Round Robin is preemptive, fair, and avoids starvation using fixed time slices, ideal for time-sharing.",
        "tags": ["cpu", "scheduling"],
    },
    {
        "title": "Context Switching Overhead",
        "prompt": "What state must be saved and restored during a CPU context switch?",
        "answer": "Program counter, CPU registers, stack pointer, and page table pointer (flushing/invalidating TLB entries unless tagged with ASID).",
        "tags": ["cpu", "processes"],
    },
    {
        "title": "Race Conditions & Critical Section",
        "prompt": "Define a race condition and explain the critical section problem.",
        "answer": "A race condition occurs when concurrent execution outcomes depend on non-deterministic interleaving. The critical section problem requires ensuring mutual exclusion, progress, and bounded waiting.",
        "tags": ["concurrency", "synchronization"],
    },
    {
        "title": "Belady's Anomaly",
        "prompt": "What is Belady's Anomaly and under which page replacement algorithm can it occur?",
        "answer": "The phenomenon where increasing the number of physical page frames results in an increase in page faults. It can happen in FIFO, but not in stack algorithms like LRU or Optimal.",
        "tags": ["memory-management", "paging"],
    },
    {
        "title": "Thrashing",
        "prompt": "What causes OS thrashing and how is it detected and mitigated?",
        "answer": "Thrashing occurs when total working set sizes exceed physical memory, causing continuous page swapping with near-zero CPU progress. Mitigated by working-set models or suspending low-priority processes.",
        "tags": ["memory-management"],
    },
    {
        "title": "Inter-Process Communication (IPC)",
        "prompt": "Compare shared memory IPC versus message passing IPC.",
        "answer": "Shared memory is the fastest because data is accessed directly in memory without kernel intervention after setup (requires synchronization). Message passing involves system calls and kernel copying.",
        "tags": ["processes", "ipc"],
    },
    {
        "title": "System Calls vs User Mode",
        "prompt": "How does execution transition from user mode to kernel mode?",
        "answer": "The CPU switches privilege levels via a software interrupt/trap instruction (e.g. syscall/sysenter). Hardware saves user registers, sets kernel stack, and jumps to the interrupt descriptor table (IDT).",
        "tags": ["kernel", "architecture"],
    },
    {
        "title": "Inverted Page Table",
        "prompt": "What advantage does an inverted page table offer for 64-bit systems?",
        "answer": "It scales with the amount of physical memory rather than virtual address space. It has one entry per physical frame indexed by a hash of (process_id, page_number).",
        "tags": ["memory-management"],
    },
    {
        "title": "Peterson's Algorithm",
        "prompt": "How does Peterson's algorithm solve mutual exclusion for two processes in software?",
        "answer": "Uses a boolean flag array `flag[2]` showing desire to enter and a shared integer `turn`. Process i sets `flag[i]=True`, `turn=j`, and spins while `flag[j] and turn == j`.",
        "tags": ["concurrency", "synchronization"],
    },
    {
        "title": "Translation Lookaside Buffer (TLB)",
        "prompt": "What is the purpose of the TLB in memory management?",
        "answer": "A high-speed associative hardware cache for page table lookups, avoiding costly multi-level page table memory access penalties on every instruction fetch and memory operand read.",
        "tags": ["memory-management", "hardware"],
    },
]

# 15 Computer Networks Q&A items
CN_DECK = [
    {
        "title": "OSI 7-Layer Model",
        "prompt": "List the 7 layers of the OSI reference model from bottom to top.",
        "answer": "1. Physical, 2. Data Link, 3. Network, 4. Transport, 5. Session, 6. Presentation, 7. Application.",
        "tags": ["protocols", "architecture"],
    },
    {
        "title": "TCP vs UDP",
        "prompt": "Contrast TCP and UDP in terms of reliability, ordering, and overhead.",
        "answer": "TCP is connection-oriented, reliable, ordered, and flow/congestion controlled with a 20-byte header. UDP is connectionless, unreliable, unordered, and lightweight with an 8-byte header.",
        "tags": ["transport-layer", "protocols"],
    },
    {
        "title": "TCP Three-Way Handshake",
        "prompt": "Describe the packets exchanged during TCP connection establishment.",
        "answer": "1. Client -> Server: SYN (seq = x). 2. Server -> Client: SYN-ACK (seq = y, ack = x + 1). 3. Client -> Server: ACK (seq = x + 1, ack = y + 1).",
        "tags": ["transport-layer", "tcp"],
    },
    {
        "title": "TCP Four-Way Teardown",
        "prompt": "Why does closing a TCP connection require four segments and a TIME_WAIT state?",
        "answer": "TCP is full-duplex, so each side must independently terminate its data stream with FIN and ACK. The initiator enters TIME_WAIT (2*MSL) to ensure final ACK delivery and drain stale network packets.",
        "tags": ["transport-layer", "tcp"],
    },
    {
        "title": "Flow Control vs Congestion Control",
        "prompt": "What is the key difference between TCP flow control and TCP congestion control?",
        "answer": "Flow control prevents the sender from overwhelming the receiver's buffer (driven by receiver advertised window rwnd). Congestion control prevents overwhelming network routers (driven by congestion window cwnd).",
        "tags": ["transport-layer", "congestion"],
    },
    {
        "title": "DNS Lookup Hierarchy",
        "prompt": "Explain the resolution sequence when querying a domain name recursively.",
        "answer": "1. Local OS / hosts file / browser cache. 2. Recursive DNS resolver (ISP/8.8.8.8). 3. Root DNS server ('.'). 4. TLD server ('.com'). 5. Authoritative name server for the target domain.",
        "tags": ["application-layer", "dns"],
    },
    {
        "title": "HTTPS & TLS Handshake",
        "prompt": "How does TLS 1.3 securely establish an encrypted communication channel?",
        "answer": "Client sends ClientHello with supported cipher suites and key share. Server responds with ServerHello, certificate, and key share. Diffie-Hellman generates shared symmetric session keys in 1 round-trip.",
        "tags": ["security", "application-layer"],
    },
    {
        "title": "CIDR & Subnet Masking",
        "prompt": "How many usable host IP addresses are available in a /28 subnet?",
        "answer": "A /28 leaves 32 - 28 = 4 host bits. 2^4 = 16 total addresses. Subtracting network address and broadcast address yields 14 usable host IPs.",
        "tags": ["network-layer", "ip-addressing"],
    },
    {
        "title": "ARP (Address Resolution Protocol)",
        "prompt": "What role does ARP play in local area network delivery?",
        "answer": "ARP resolves an IPv4 network layer address into a physical 48-bit MAC address for Ethernet frame delivery within the same local broadcast domain.",
        "tags": ["link-layer", "network-layer"],
    },
    {
        "title": "NAT (Network Address Translation)",
        "prompt": "How does NAPT (Network Address Port Translation) allow multiple private devices to share a single public IP?",
        "answer": "The NAT router rewrites source private IP:Port combinations to its public IP and an allocated dynamic source port, tracking translations in a NAT state table.",
        "tags": ["network-layer"],
    },
    {
        "title": "Distance Vector vs Link State Routing",
        "prompt": "Compare RIP (Distance Vector) with OSPF (Link State).",
        "answer": "RIP uses Bellman-Ford, shares routing tables with direct neighbors by hop count, and is prone to count-to-infinity. OSPF floods link-state advertisements (LSAs) and calculates Dijkstra SPF trees globally.",
        "tags": ["routing", "network-layer"],
    },
    {
        "title": "SYN Flood Attack & SYN Cookies",
        "prompt": "How does a SYN flood attack degrade a server and how do SYN cookies mitigate it?",
        "answer": "Attacker sends spoofed SYNs without completing handshakes, exhausting the TCP connection backlog queue. SYN cookies encode connection state into the initial SYN-ACK sequence number without allocating memory.",
        "tags": ["security", "transport-layer"],
    },
    {
        "title": "WebSocket vs HTTP Long Polling",
        "prompt": "Why is WebSocket preferred over long polling for real-time bidirectional communication?",
        "answer": "WebSocket upgrades an initial HTTP handshake into a persistent full-duplex TCP socket with minimal 2-10 byte framing overhead, avoiding repetitive HTTP header exchanges and reconnect overhead.",
        "tags": ["application-layer", "web"],
    },
    {
        "title": "MTU and IP Fragmentation",
        "prompt": "What happens when an IP packet exceeds the egress interface MTU?",
        "answer": "If Don't Fragment (DF) is set, the router drops the packet and sends ICMP Destination Unreachable (Fragmentation Needed). Otherwise, the router splits the payload into fragments with offset flags.",
        "tags": ["network-layer"],
    },
    {
        "title": "DHCP DORA Process",
        "prompt": "What are the four phases of automatic IP configuration via DHCP?",
        "answer": "1. Discover (broadcast by client). 2. Offer (unicast/broadcast by server). 3. Request (client accepts lease). 4. Acknowledge (server binds IP and configuration parameters).",
        "tags": ["application-layer", "protocols"],
    },
]

# 8 DSA Problem cards
DSA_DECK = [
    {
        "title": "Two Sum",
        "url": "https://leetcode.com/problems/two-sum",
        "difficulty": "Easy",
        "tags": ["arrays", "hash-table"],
    },
    {
        "title": "Best Time to Buy and Sell Stock",
        "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock",
        "difficulty": "Easy",
        "tags": ["arrays", "dynamic-programming"],
    },
    {
        "title": "Longest Substring Without Repeating Characters",
        "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters",
        "difficulty": "Medium",
        "tags": ["strings", "sliding-window"],
    },
    {
        "title": "LRU Cache",
        "url": "https://leetcode.com/problems/lru-cache",
        "difficulty": "Medium",
        "tags": ["design", "hash-table", "linked-list"],
    },
    {
        "title": "Number of Islands",
        "url": "https://leetcode.com/problems/number-of-islands",
        "difficulty": "Medium",
        "tags": ["graphs", "bfs", "dfs"],
    },
    {
        "title": "Course Schedule",
        "url": "https://leetcode.com/problems/course-schedule",
        "difficulty": "Medium",
        "tags": ["graphs", "topological-sort"],
    },
    {
        "title": "Merge k Sorted Lists",
        "url": "https://leetcode.com/problems/merge-k-sorted-lists",
        "difficulty": "Hard",
        "tags": ["linked-list", "heap"],
    },
    {
        "title": "Trapping Rain Water",
        "url": "https://leetcode.com/problems/trapping-rain-water",
        "difficulty": "Hard",
        "tags": ["arrays", "two-pointers", "dynamic-programming"],
    },
]


def seed_database() -> dict:
    """Execute idempotent seeding of demo user, subjects, items, tags, and sample reviews."""
    db = SessionLocal()
    try:
        # 1. Create or retrieve demo user
        user = db.query(User).filter(User.email == DEMO_EMAIL).first()
        if not user:
            user = User(
                email=DEMO_EMAIL,
                password_hash=get_password_hash(DEMO_PASSWORD),
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        # 2. Subjects mapping
        subject_configs = [
            {"name": "Operating Systems", "color": "#3B82F6", "items": OS_DECK, "type": "qa"},
            {"name": "Computer Networks", "color": "#10B981", "items": CN_DECK, "type": "qa"},
            {"name": "Data Structures & Algorithms", "color": "#8B5CF6", "items": DSA_DECK, "type": "problem"},
        ]

        total_items_created = 0
        total_tags_created = 0

        for s_cfg in subject_configs:
            subj = (
                db.query(Subject)
                .filter(Subject.user_id == user.id, Subject.name == s_cfg["name"])
                .first()
            )
            if not subj:
                subj = Subject(user_id=user.id, name=s_cfg["name"], color=s_cfg["color"])
                db.add(subj)
                db.flush()

            # Cache existing tags
            tag_map = {
                t.name: t
                for t in db.query(Tag).filter(Tag.subject_id == subj.id).all()
            }

            for card_data in s_cfg["items"]:
                # Ensure tags exist
                card_tags = []
                for t_name in card_data["tags"]:
                    norm_tname = t_name.strip().lower()
                    if norm_tname not in tag_map:
                        new_tag = Tag(subject_id=subj.id, name=norm_tname)
                        db.add(new_tag)
                        db.flush()
                        tag_map[norm_tname] = new_tag
                        total_tags_created += 1
                    card_tags.append(tag_map[norm_tname])

                # Check if item exists
                existing_item = (
                    db.query(Item)
                    .filter(Item.subject_id == subj.id, Item.title == card_data["title"])
                    .first()
                )
                if not existing_item:
                    item_type = s_cfg["type"]
                    new_item = Item(
                        subject_id=subj.id,
                        type=item_type,
                        title=card_data["title"],
                        prompt=card_data.get("prompt"),
                        answer=card_data.get("answer"),
                        url=card_data.get("url"),
                        difficulty=card_data.get("difficulty"),
                        tags=card_tags,
                    )
                    db.add(new_item)
                    db.flush()
                    total_items_created += 1

                    # Initialize user_items row for SM-2
                    user_item = UserItem(
                        user_id=user.id,
                        item_id=new_item.id,
                        ease_factor=2.5,
                        interval_days=0,
                        repetitions=0,
                        next_review_date=date.today(),
                    )
                    db.add(user_item)
                    db.flush()

        db.commit()

        # Seed sample historical review activity for demo visualization if empty
        user_items = db.query(UserItem).filter(UserItem.user_id == user.id).all()
        existing_logs_count = (
            db.query(func.count(ReviewLog.id))
            .join(UserItem, ReviewLog.user_item_id == UserItem.id)
            .filter(UserItem.user_id == user.id)
            .scalar()
            or 0
        )

        if existing_logs_count == 0 and user_items:
            # Seed 5 days of past reviews to showcase activity heatmaps and streaks
            today = date.today()
            for day_offset in range(4, -1, -1):
                rev_day = today - timedelta(days=day_offset)
                rev_dt = datetime.combine(rev_day, datetime.min.time(), tzinfo=timezone.utc) + timedelta(hours=14)

                for ui in user_items[:4]:  # Review 4 items per day
                    rating = "easy" if ui.id % 2 == 0 else "shaky"
                    log = ReviewLog(
                        user_item_id=ui.id,
                        rating=rating,
                        time_taken_seconds=12,
                        reviewed_at=rev_dt,
                    )
                    db.add(log)
            db.commit()

        summary = {
            "demo_user": DEMO_EMAIL,
            "subjects": [s["name"] for s in subject_configs],
            "os_items": len(OS_DECK),
            "cn_items": len(CN_DECK),
            "dsa_items": len(DSA_DECK),
            "total_cards": len(OS_DECK) + len(CN_DECK) + len(DSA_DECK),
        }
        print(f"Seeding completed successfully: {summary}")
        return summary
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
