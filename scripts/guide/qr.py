# 최소 QR 인코더: 바이트 모드, 오류정정 M, 버전 1~6
import sys
EC_M = {1:(10,[(1,16)]),2:(16,[(1,28)]),3:(26,[(1,44)]),4:(18,[(2,32)]),5:(24,[(2,43)]),6:(16,[(4,27)])}
ALIGN = {1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34]}
EXP=[0]*512; LOG=[0]*256; x=1
for i in range(255):
    EXP[i]=x; LOG[x]=i; x<<=1
    if x&0x100: x^=0x11d
for i in range(255,512): EXP[i]=EXP[i-255]
def gmul(a,b): return 0 if a==0 or b==0 else EXP[LOG[a]+LOG[b]]
def rs(data,n):
    g=[1]
    for i in range(n):
        ng=[0]*(len(g)+1)
        for j,c in enumerate(g):
            ng[j]^=c; ng[j+1]^=gmul(c,EXP[i])
        g=ng
    r=list(data)+[0]*n
    for i in range(len(data)):
        c=r[i]
        if c:
            for j in range(1,len(g)): r[i+j]^=gmul(g[j],c)
    return r[len(data):]
def encode(text):
    b=text.encode()
    for v in range(1,7):
        ec,groups=EC_M[v]; cap=sum(n*k for n,k in groups)
        if 4+8+8*len(b) <= cap*8: break
    else: raise ValueError("too long")
    bits=[]
    def put(val,n): bits.extend((val>>(n-1-i))&1 for i in range(n))
    put(4,4); put(len(b),8)
    for ch in b: put(ch,8)
    put(0,min(4,cap*8-len(bits)))
    while len(bits)%8: bits.append(0)
    data=[int(''.join(map(str,bits[i:i+8])),2) for i in range(0,len(bits),8)]
    pad=[0xEC,0x11]; i=0
    while len(data)<cap: data.append(pad[i%2]); i+=1
    blocks=[]; p=0
    for n,k in groups:
        for _ in range(n): blocks.append(data[p:p+k]); p+=k
    ecs=[rs(bl,ec) for bl in blocks]
    out=[]
    for i in range(max(len(bl) for bl in blocks)):
        for bl in blocks:
            if i<len(bl): out.append(bl[i])
    for i in range(ec):
        for e in ecs: out.append(e[i])
    return v,out
def matrix(text):
    v,cw=encode(text); N=17+4*v
    M=[[None]*N for _ in range(N)]; F=[[False]*N for _ in range(N)]
    def setf(r,c,val): M[r][c]=val; F[r][c]=True
    def finder(r0,c0):
        for r in range(-1,8):
            for c in range(-1,8):
                rr,cc=r0+r,c0+c
                if 0<=rr<N and 0<=cc<N:
                    on = 0<=r<=6 and 0<=c<=6 and (r in (0,6) or c in (0,6) or (2<=r<=4 and 2<=c<=4))
                    setf(rr,cc,1 if on else 0)
    finder(0,0); finder(0,N-7); finder(N-7,0)
    for i in range(8,N-8): setf(6,i,1-i%2); setf(i,6,1-i%2)
    a=ALIGN[v]
    for r in a:
        for c in a:
            if F[r][c]: continue
            for dr in range(-2,3):
                for dc in range(-2,3):
                    setf(r+dr,c+dc,1 if max(abs(dr),abs(dc))!=1 else 0)
    setf(N-8,8,1)
    # 형식 정보 자리 예약
    for i in range(9):
        if not F[8][i]: setf(8,i,0)
        if not F[i][8]: setf(i,8,0)
    for i in range(8):
        setf(8,N-1-i,0); setf(N-1-i,8,0)
    bits=[]
    for byte in cw: bits.extend((byte>>(7-i))&1 for i in range(8))
    base=[row[:] for row in M]
    # 데이터 배치
    idx=0; c=N-1; up=True
    pos=[]
    while c>0:
        if c==6: c-=1
        rows=range(N-1,-1,-1) if up else range(N)
        for r in rows:
            for cc in (c,c-1):
                if not F[r][cc]: pos.append((r,cc))
        up=not up; c-=2
    masks=[lambda r,c:(r+c)%2==0,lambda r,c:r%2==0,lambda r,c:c%3==0,lambda r,c:(r+c)%3==0,
           lambda r,c:(r//2+c//3)%2==0,lambda r,c:(r*c)%2+(r*c)%3==0,lambda r,c:((r*c)%2+(r*c)%3)%2==0,lambda r,c:((r+c)%2+(r*c)%3)%2==0]
    def fmt_bits(mask):
        d=(0b00<<3)|mask  # M = 00
        rem=d<<10
        for i in range(14,9,-1):
            if rem>>i &1: rem^=0x537<<(i-10)
        return ((d<<10)|rem)^0x5412
    def build(mask):
        A=[row[:] for row in base]
        for k,(r,c) in enumerate(pos):
            bit=bits[k] if k<len(bits) else 0
            if masks[mask](r,c): bit^=1
            A[r][c]=bit
        f=fmt_bits(mask)
        fb=[(f>>(14-i))&1 for i in range(15)]
        # 왼쪽 위
        coords1=[(8,0),(8,1),(8,2),(8,3),(8,4),(8,5),(8,7),(8,8),(7,8),(5,8),(4,8),(3,8),(2,8),(1,8),(0,8)]
        coords2=[(N-1,8),(N-2,8),(N-3,8),(N-4,8),(N-5,8),(N-6,8),(N-7,8),(8,N-8),(8,N-7),(8,N-6),(8,N-5),(8,N-4),(8,N-3),(8,N-2),(8,N-1)]
        for i in range(15):
            r,c=coords1[i]; A[r][c]=fb[i]
            r,c=coords2[i]; A[r][c]=fb[i]
        return A
    def penalty(A):
        s=0
        for L in (A,[list(x) for x in zip(*A)]):
            for row in L:
                run=1
                for i in range(1,N):
                    if row[i]==row[i-1]: run+=1
                    else:
                        if run>=5: s+=run-2
                        run=1
                if run>=5: s+=run-2
                st=''.join(map(str,row))
                s+=40*(st.count('10111010000')+st.count('00001011101'))
        for r in range(N-1):
            for c in range(N-1):
                if A[r][c]==A[r][c+1]==A[r+1][c]==A[r+1][c+1]: s+=3
        dark=sum(map(sum,A)); s+=10*(abs(dark*100//(N*N)-50)//5)
        return s
    best=min(range(8),key=lambda m:penalty(build(m)))
    return build(best)
def svg(text, color="#0B1736"):
    A=matrix(text); N=len(A); q=4; S=N+2*q
    path=''.join(f"M{c+q},{r+q}h1v1h-1z" for r in range(N) for c in range(N) if A[r][c])
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {S} {S}" shape-rendering="crispEdges"><rect width="{S}" height="{S}" fill="#fff"/><path d="{path}" fill="{color}"/></svg>'
def png(text, path, scale=12):
    from PIL import Image
    A=matrix(text); N=len(A); q=4; S=(N+2*q)*scale
    im=Image.new("L",(S,S),255); px=im.load()
    for r in range(N):
        for c in range(N):
            if A[r][c]:
                for y in range((r+q)*scale,(r+q+1)*scale):
                    for x in range((c+q)*scale,(c+q+1)*scale): px[x,y]=0
    im.save(path)
if __name__=="__main__":
    import cv2
    for name,url in [("owner","https://bosscall-ten.vercel.app/guide"),("driver","https://bosscall-ten.vercel.app/guide/driver")]:
        p=f"{sys.argv[1]}/test-{name}.png"; png(url,p)
        val,_,_=cv2.QRCodeDetector().detectAndDecode(cv2.imread(p))
        print(name, "OK" if val==url else f"FAIL {val!r}")
        open(f"{sys.argv[2]}/qr-{name}.svg","w").write(svg(url))
