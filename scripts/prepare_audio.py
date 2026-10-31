"""Create original, deterministic game music and effects as PCM WAV assets."""
from pathlib import Path
import wave
import numpy as np

OUT=Path(__file__).resolve().parent.parent/'public/audio'
OUT.mkdir(parents=True,exist_ok=True)
RATE=22050
rng=np.random.default_rng(20261031)

def save(name,samples):
    peak=np.max(np.abs(samples))
    if peak>.93:samples=samples*.93/peak
    pcm=(np.clip(samples,-1,1)*32767).astype('<i2')
    with wave.open(str(OUT/(name+'.wav')),'wb') as f:
        f.setnchannels(1);f.setsampwidth(2);f.setframerate(RATE);f.writeframes(pcm.tobytes())

def tone(freq,duration=.2,volume=.3,end=None,bright=0):
    t=np.arange(int(RATE*duration))/RATE
    phase=2*np.pi*(freq*t+((end or freq)-freq)*t*t/(2*duration))
    wave=np.sin(phase)+bright*np.sin(2*phase)*.3
    envelope=(1-np.exp(-t*160))*np.exp(-t/(duration*.24))
    return wave*envelope*volume

def sequence(notes,duration=.18,step=.11,volume=.3):
    out=np.zeros(int((step*(len(notes)-1)+duration)*RATE))
    for i,f in enumerate(notes):
        v=tone(f,duration,volume,bright=.3);start=int(i*step*RATE);out[start:start+len(v)]+=v
    return out

def noise(duration,volume=.25):
    t=np.arange(int(RATE*duration))/RATE
    n=rng.uniform(-1,1,len(t));n=np.convolve(n,np.ones(5)/5,mode='same')
    return n*np.exp(-t/(duration*.18))*(1-np.exp(-t*800))*volume

def mix(*parts):
    out=np.zeros(max(map(len,parts)))
    for p in parts:out[:len(p)]+=p
    return out

save('laugh',sequence([620,790,620],.14,.065,.28))
save('dog',mix(sequence([185,145],.17,.12,.5),noise(.34,.32)))
save('punch',mix(tone(120,.13,.5,end=55),noise(.14,.5)))
save('combo',mix(tone(90,.27,.6,end=42),noise(.3,.65)))
save('summon',sequence([523.25,659.25,783.99],.23,.065,.28))
save('mouseHit',tone(1160,.085,.17,end=1600))
save('kill',tone(720,.12,.2,end=1420))
save('build',sequence([392,523.25,659.25],.22,.07,.3))
save('upgrade',sequence([523.25,659.25,783.99,1046.5],.29,.09,.32))
save('sell',sequence([660,520,392],.17,.07,.25))
save('leak',sequence([220,164.81],.3,.16,.38))
save('wave',sequence([261.63,329.63,392],.25,.13,.32))
save('clear',sequence([392,523.25,659.25],.3,.14,.28))
save('skill',mix(sequence([523.25,659.25,783.99,1046.5,1568],.55,.1,.32),noise(1,.17)))
save('win',sequence([523.25,659.25,783.99,1046.5,783.99,1046.5],.6,.18,.35))
save('lose',sequence([392,329.63,293.66,261.63],.65,.22,.32))

# A seamless 16-bar toy-piano / bell loop, composed for this game.
step=.24;length=int(64*step*RATE);music=np.zeros(length)
chords=[[48,52,55,59],[45,48,52,55],[41,45,48,52],[43,47,50,55]]
melody=[72,0,76,79,0,76,74,0,71,0,72,76,0,74,72,0,
        69,0,72,76,0,79,76,0,72,0,71,69,0,67,69,0,
        69,0,72,77,0,76,72,0,69,0,67,65,0,69,72,0,
        67,0,71,74,0,79,77,0,74,0,71,67,0,71,74,0]
freq=lambda midi:440*2**((midi-69)/12)
def add_loop(start,clip):
    indices=(np.arange(len(clip))+int(start*RATE))%length
    np.add.at(music,indices,clip)
for i,note in enumerate(melody):
    if note:add_loop(i*step,tone(freq(note),.7,.10,bright=.4))
    if i%4==0:add_loop(i*step,tone(freq(chords[i//16][0]-12),.65,.13))
    if i%8==0:
        for j,n in enumerate(chords[i//16]):add_loop(i*step+j*.018,tone(freq(n),2.2,.045))
    if i%2==1:add_loop(i*step,noise(.07,.028))
save('garden-loop',music)
print(f'Generated 17 WAV assets, {sum(p.stat().st_size for p in OUT.glob("*.wav"))/1024/1024:.2f} MiB')
