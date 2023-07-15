```mermaid
stateDiagram-v2
    [*] --> Loading: subscribe
    Loading --> [*]: success
    Loading --> Interrupted: interrupt
    Interrupted --> Loading: resume
```
