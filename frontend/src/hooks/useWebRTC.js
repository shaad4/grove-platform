import { useEffect, useRef, useCallback, useState } from "react";

const ICE_SERVERS = [{ urls: import.meta.env.VITE_STUN_URL }]


export function useWebRTC({ wsKey, sendSignal, currentUserId }){
  const [callState, setCallState]   = useState('idle')      // idle | calling | incoming | active
  const [remoteStream, setRemoteStream] = useState(null)
  const [localStream,  setLocalStream]  = useState(null)
  const [isMuted,    setIsMuted]    = useState(false)
  const [isCamOff,   setIsCamOff]   = useState(false)

  const pc = useRef(null)
  const incomingOffer = useRef(null)

  // create a peer connetion
  const createPC = useCallback(() => {
    const conn = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    conn.onicecandidate = (e) => {
      if (e.candidate) {
        sendSignal({ type: 'ice_candidate', candidate: e.candidate })
      }
    }

    conn.ontrack = (e) => {
      setRemoteStream(e.streams[0])
    }

    conn.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(conn.connectionState)) {
        hangUp()
      }
    }

    return conn

  }, [sendSignal])


  // Get local media

  const getMedia = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    setLocalStream(stream)
    return stream
  })

  // start a call -- caller side

  const startCall = useCallback(async () => {
    setCallState('calling')
    pc.current = createPC()
    const stream = await getMedia()
    stream.getTracks().forEach(t => pc.current.addTrack(t, stream))

    const offer = await pc.current.createOffer()
    await pc.current.setLocalDescription(offer)
    sendSignal({ type: 'call_offer', sdp: offer })
  }, [createPC, getMedia, sendSignal ])

  //accept incomming call -- callee side

  const acceptCall = useCallback(async () => {
    if (!incomingOffer.current) return
    setCallState('active')
    pc.current  = createPC()
    const stream = await getMedia()
    stream.getTracks().forEach(t => pc.current.addTrack(t, stream))

    await pc.current.setRemoteDescription(
      new RTCSessionDescription(incomingOffer.current)
    )

    const answer = await pc.current.createAnswer()
    await pc.current.setLocalDescription(answer)
    sendSignal({ type: 'call_answer', sdp: answer })
    incomingOffer.current = null
  }, [createPC, getMedia, sendSignal])

  // Hang up

  const hangUp = useCallback(() => {
    sendSignal({ type: 'call_end' })
    localStream?.getTracks().forEach(t => t.stop())
    pc.current?.close()
    pc.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setCallState('idle')
    incomingOffer.current = null
  }, [localStream, sendSignal])

  // Decline incoming

  const declineCall = useCallback(() => {
    sendSignal({ type: 'call_end' })
    incomingOffer.current = null
    setCallState('idle')
  }, [sendSignal])

  // Handle incomming WS Signals
  const handleSignal = useCallback(async (msg) => {
    if (msg.type === 'call_offer'){
      incomingOffer.current = msg.sdp
      setCallState('incoming')
    }

    if (msg.type === 'call_answer' && pc.current){
      await pc.current.setRemoteDescription(
        new RTCSessionDescription(msg.sdp)
      )
      setCallState('active')
    }

    if (msg.type === 'ice_candidate' && pc.current){
      try{
        await pc.current.addIceCandidate(new RTCIceCandidate(msg.candidate))
      } catch {}
    }

    if (msg.type === 'call_end'){
      localStream?.getTracks().forEach(t => t.stop())
      pc.current?.close()
      pc.current = null
      setLocalStream(null)
      setRemoteStream(null)
      setCallState('idle')
    }
  }, [localStream])

  // mute / cam toggling

  const toggleMute = useCallback(() => {
    localStream?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setIsMuted(p => !p)
  }, [localStream])

  const toggleCam = useCallback(() => {
    localStream?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setIsCamOff(p => !p)
  })

  // cleanup on umounts
  useEffect(() => {
    return () => {
      localStream?.getTracks().forEach(t => t.stop())
      pc.current?.close()
    }
  }, [])


  return {
    callState,
    localStream,
    remoteStream,
    isMuted,
    isCamOff,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    handleSignal,
    toggleMute,
    toggleCam,
  }
}