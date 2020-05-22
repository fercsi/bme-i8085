/*
 *   i8085 Simulator v1.2.0
 *   (c) Vajda Ferenc, 2007-2011
 *   BME, IIT / Doxence
 *   vajda@iit.bme.hu
 */

// TODO _phases increase in read/write -> not in dummy!

var yieldTime = 1000;

//----------------------------------------------------------------Variables-//[
var init_mem = new Array;
var init_ior = new Array;
var init_iow = new Array;
var mem_string;

var _reg_a, _reg_b, _reg_c, _reg_d, _reg_e, _reg_h, _reg_l;
var _flag_cy, _flag_z, _flag_p, _flag_s, _flag_ac;
var _flag_v, _flag_x5; // undocumented flags
var _reg_pc, _reg_sp;
var _halt, _inte;
var _rdinte; // executing trap routine RIM returns original INTE
var _rst5_5_mask, _rst6_5_mask, _rst7_5_mask, _rst5_5, _rst6_5, _rst7_5, _sid;
var _rst7_5_ff, _sod, _trap, _int;
var _phases;

var _mem; 
var _ior;
var _iow;
var _codes;

// Config
var _cpuFreq = 3.072; //MHz
var _codeStartPC = 0;
var _codeStart = 0x0000;
var _codeSize = 256;
var _stackSize = 10;
var _busActivity = 0;
var _followCode = 0;
var _running = 0;
var _delay = 0;

// tmp
var __mem_string;
var __inte;   // wait one instruction before running IT
var __rst7_5_iff;
var __trap;

// modules
var modules = [];
var modulesMWR = [];
var modulesMRD = [];
var modulesIOWR = [];
var modulesIORD = [];

//--------------------------------------------------------------------------//[
/// <description>TODO</description>
var instrs = new Array(
    "NOP"     , "LXI   B, @2" , "STAX  B" , "INX   B" , "INR   B", "DCR   B", "MVI   B, @1", "RLC",
    "#DSUB"   , "DAD   B"     , "LDAX  B" , "DCX   B" , "INR   C", "DCR   C", "MVI   C, @1", "RRC",
    "#ARHL"   , "LXI   D, @2" , "STAX  D" , "INX   D" , "INR   D", "DCR   D", "MVI   D, @1", "RAL",
    "#RDEL"   , "DAD   D"     , "LDAX  D" , "DCX   D" , "INR   E", "DCR   E", "MVI   E, @1", "RAR",
    "RIM"     , "LXI   H, @2" , "SHLD  @2", "INX   H" , "INR   H", "DCR   H", "MVI   H, @1", "DAA",
    "#LDHI @1", "DAD   H"     , "LHLD  @2", "DCX   H" , "INR   L", "DCR   L", "MVI   L, @1", "CMA",
    "SIM"     , "LXI   SP, @2", "STA   @2", "INX   SP", "INR   M", "DCR   M", "MVI   M, @1", "STC",
    "#LDSI @1", "DAD   SP"    , "LDA   @2", "DCX   SP", "INR   A", "DCR   A", "MVI   A, @1", "CMC",

    "MOV   B, B", "MOV   B, C", "MOV   B, D", "MOV   B, E", "MOV   B, H", "MOV   B, L", "MOV   B, M", "MOV   B, A",
    "MOV   C, B", "MOV   C, C", "MOV   C, D", "MOV   C, E", "MOV   C, H", "MOV   C, L", "MOV   C, M", "MOV   C, A",
    "MOV   D, B", "MOV   D, C", "MOV   D, D", "MOV   D, E", "MOV   D, H", "MOV   D, L", "MOV   D, M", "MOV   D, A",
    "MOV   E, B", "MOV   E, C", "MOV   E, D", "MOV   E, E", "MOV   E, H", "MOV   E, L", "MOV   E, M", "MOV   E, A",
    "MOV   H, B", "MOV   H, C", "MOV   H, D", "MOV   H, E", "MOV   H, H", "MOV   H, L", "MOV   H, M", "MOV   H, A",
    "MOV   L, B", "MOV   L, C", "MOV   L, D", "MOV   L, E", "MOV   L, H", "MOV   L, L", "MOV   L, M", "MOV   L, A",
    "MOV   M, B", "MOV   M, C", "MOV   M, D", "MOV   M, E", "MOV   M, H", "MOV   M, L", "HLT"       , "MOV   M, A",
    "MOV   A, B", "MOV   A, C", "MOV   A, D", "MOV   A, E", "MOV   A, H", "MOV   A, L", "MOV   A, M", "MOV   A, A",

    "ADD   B", "ADD   C", "ADD   D", "ADD   E", "ADD   H", "ADD   L", "ADD   M", "ADD   A",
    "ADC   B", "ADC   C", "ADC   D", "ADC   E", "ADC   H", "ADC   L", "ADC   M", "ADC   A",
    "SUB   B", "SUB   C", "SUB   D", "SUB   E", "SUB   H", "SUB   L", "SUB   M", "SUB   A",
    "SBB   B", "SBB   C", "SBB   D", "SBB   E", "SBB   H", "SBB   L", "SBB   M", "SBB   A",
    "ANA   B", "ANA   C", "ANA   D", "ANA   E", "ANA   H", "ANA   L", "ANA   M", "ANA   A",
    "XRA   B", "XRA   C", "XRA   D", "XRA   E", "XRA   H", "XRA   L", "XRA   M", "XRA   A",
    "ORA   B", "ORA   C", "ORA   D", "ORA   E", "ORA   H", "ORA   L", "ORA   M", "ORA   A",
    "CMP   B", "CMP   C", "CMP   D", "CMP   E", "CMP   H", "CMP   L", "CMP   M", "CMP   A",

    "RNZ", "POP   B"  , "JNZ   @2", "JMP   @2", "CNZ   @2", "PUSH  B"  , "ADI   @1", "RST   0",
    "RZ" , "RET"      , "JZ    @2", "#RSTV"   , "CZ    @2", "CALL  @2" , "ACI   @1", "RST   1",
    "RNC", "POP   D"  , "JNC   @2", "OUT   @1", "CNC   @2", "PUSH  D"  , "SUI   @1", "RST   2",
    "RC" , "#SHLX"    , "JC    @2", "IN    @1", "CC    @2", "#JNX5 @2" , "SBI   @1", "RST   3",
    "RPO", "POP   H"  , "JPO   @2", "XTHL"    , "CPO   @2", "PUSH  H"  , "ANI   @1", "RST   4",
    "RPE", "PCHL"     , "JPE   @2", "XCHG"    , "CPE   @2", "#LHLX"    , "XRI   @1", "RST   5",
    "RP" , "POP   PSW", "JP    @2", "DI"      , "CP    @2", "PUSH  PSW", "ORI   @1", "RST   6",
    "RM" , "SPHL"     , "JM    @2", "EI"      , "CM    @2", "#JX5  @2" , "CPI   @1", "RST   7"
);
//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
var phases = new Array (
    4, 10,  7,  6,  4,  4,  7,  4,   10, 10,  7,  6,  4,  4,  7,  4, 
    7, 10,  7,  6,  4,  4,  7,  4,   10, 10,  7,  6,  4,  4,  7,  4,  
    4, 10, 16,  6,  4,  4,  7,  4,   10, 10, 16,  6,  4,  4,  7,  4, 
    4, 10, 13,  6, 10, 10, 10,  4,   10, 10, 13,  6,  4,  4,  7,  4,  

    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4, 
    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4,  
    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4, 
    7,  7,  7,  7,  7,  7,  5,  7,   4,  4,  4,  4,  4,  4,  7,  4,  

    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4, 
    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4,  
    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4, 
    4,  4,  4,  4,  4,  4,  7,  4,   4,  4,  4,  4,  4,  4,  7,  4,  

    6, 10,  7, 10,  9, 12,  7, 12,   6, 10,  7,  6,  9, 18,  7, 12, 
    6, 10,  7, 10,  9, 12,  7, 12,   6, 10,  7, 10,  9,  7,  7, 12,  
    6, 10,  7, 16,  9, 12,  7, 12,   6,  6,  7,  4,  9, 10,  7, 12, 
    6, 10,  7,  4,  9, 12,  7, 12,   6,  6,  7,  4,  9,  7,  7, 12
);
//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
var mcycles = new Array (
    1, 3, 2, 1, 1, 1, 2, 1,  3, 1, 2, 1, 1, 1, 2, 1, 
    2, 3, 2, 1, 1, 1, 2, 1,  3, 1, 2, 1, 1, 1, 2, 1, 
    1, 3, 5, 1, 1, 1, 2, 1,  3, 1, 5, 1, 1, 1, 2, 1, 
    1, 3, 4, 1, 3, 3, 3, 1,  3, 1, 4, 1, 1, 1, 2, 1, 

    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 
    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 
    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 
    2, 2, 2, 2, 2, 2, 1, 2,  1, 1, 1, 1, 1, 1, 2, 1, 

    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 
    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 
    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 
    1, 1, 1, 1, 1, 1, 2, 1,  1, 1, 1, 1, 1, 1, 2, 1, 

    1, 3, 2, 3, 2, 3, 2, 3,  1, 3, 2, 1, 2, 5, 2, 3, 
    1, 3, 2, 3, 2, 3, 2, 3,  1, 3, 2, 3, 2, 2, 2, 3, 
    1, 3, 2, 5, 2, 3, 2, 3,  1, 1, 2, 1, 2, 3, 2, 3, 
    1, 3, 2, 1, 2, 3, 2, 3,  1, 1, 2, 1, 2, 2, 2, 3
);
//]
//--------------------------------------------------------------------------//[
var lengths = new Array (
    1,3,1,1,1,1,2,1, 1,1,1,1,1,1,2,1, 1,3,1,1,1,1,2,1, 1,1,1,1,1,1,2,1,
    1,3,3,1,1,1,2,1, 2,1,3,1,1,1,2,1, 1,3,3,1,1,1,2,1, 2,1,3,1,1,1,2,1,
    1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,
    1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1, 1,1,1,1,1,1,1,1,
    1,1,3,3,3,1,2,1, 1,1,3,1,3,3,2,1, 1,1,3,2,3,1,2,1, 1,1,3,2,3,3,2,1,
    1,1,3,1,3,1,2,1, 1,1,3,1,3,1,2,1, 1,1,3,1,3,1,2,1, 1,1,3,1,3,3,2,1
);//]

//-----------------------------------------------------------------Nav test-//[
var navAgent = window.navigator.userAgent;
var nav =
    navAgent.match( /Firefox/ )   ? "FF" :
    navAgent.match( /Opera/ )     ? "OP" :
    navAgent.match( /MSIE/ )      ? "IE" :
    navAgent.match( /Netscape/ )  ? "NS" :
    navAgent.match( /Safari/ )    ? "SF" :
    navAgent.match( /Konqueror/ ) ? "KQ" :
    navAgent.match( /Camino/ )    ? "CM" :
    navAgent.match( /Mozilla/ )   ? "MZ" :
    "other";
var nl = nav == "IE" ? "\r" : "\n";
//]
//]

//----------------------------------------------------------------Processor-//[
// TODO
// 08 DSUB ..... OK but all flags (except CY)
// 10 ARHL ..... OK
// 18 RDEL ..... OK V?
// 28 LDHI ..... OK
// 38 LDSI ..... OK
// CB RSTV ..... OK
// D9 SHLX ..... OK
// ED LHLX ..... OK
// DD JNX5 ..... OK
// FD JX5 ...... OK
// ?? flag X5 
// ?? flag V
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function exec_instruction() {
    var t;
    // TODO INT
    // rst5_5... mask alapérték?
    // EI -> RIM?
    if ( _trap && !__trap ) {
        _inte = 0; __inte = 0; // _rdinte = 0 -- do not modify
        WriteSP16( _reg_pc );
        _reg_pc = 0x0024;
    } else if ( __inte && !_rst7_5_mask && _rst7_5_ff && !__rst7_5_iff ) {
        _inte = 0; __inte = 0; _rdinte = 0;
        WriteSP16( _reg_pc );
        _reg_pc = 0x003C;
        __rst7_5_iff = 1;
    } else if ( __inte && !_rst6_5_mask && _rst6_5 ) {
        _inte = 0; __inte = 0; _rdinte = 0;
        WriteSP16( _reg_pc );
        _reg_pc = 0x0034;
    } else if ( __inte && !_rst5_5_mask && _rst5_5 ) {
        _inte = 0; __inte = 0; _rdinte = 0;
        WriteSP16( _reg_pc );
        _reg_pc = 0x002C;
    } else if ( __inte && _int ) {
        // TODO
    }
    __inte = _inte;
    __trap = _trap;
    var code = ReadPC();
    _phases += phases[ code ] + _delay * mcycles[ code ];
    switch ( code ) {
        case 0x00: break; // NOP
        case 0x01: _reg_c = ReadPC(); _reg_b = ReadPC(); break; // LXI B, data16
        case 0x02: WriteBC( _reg_a ); break; // STAX B
        case 0x03: if ( ++_reg_c == 256 ) { _reg_c = 0; _reg_b++; _reg_b &= 0xff; } break; // INX B
        case 0x04: _reg_b = ALU_INR( _reg_b ); break;
        case 0x05: _reg_b = ALU_DCR( _reg_b ); break;
        case 0x06: _reg_b = ReadPC(); break;
        case 0x07: ALU_RLC(); break;
        case 0x08: Dummy(); Dummy(); _reg_l -= _reg_c; _reg_h -= _reg_b + ( _reg_l < 0 ? 1 : 0 ); _flag_cy = _reg_h < 0 ? 1 : 0; _reg_l &= 0xff; _reg_h &= 0xff; break; // DSUB
        case 0x09: Dummy(); Dummy(); _reg_l += _reg_c; _reg_h += _reg_b + ( _reg_l >> 8 ); _flag_cy = _reg_h >> 8; _reg_l &= 0xff; _reg_h &= 0xff; break;
        case 0x0a: _reg_a = ReadBC(); break;
        case 0x0b: if ( --_reg_c < 0 ) { _reg_c = 0xff; _reg_b--; _reg_b &= 0xff; } break;
        case 0x0c: _reg_c = ALU_INR( _reg_c ); break;
        case 0x0d: _reg_c = ALU_DCR( _reg_c ); break;
        case 0x0e: _reg_c = ReadPC(); break;
        case 0x0f: ALU_RRC(); break;
        case 0x10: Dummy(); _flag_cy = _reg_l & 1; _reg_l = ( _reg_l >> 1 ) | ( ( _reg_h & 1 ) ? 0x80 : 0x00 ); _reg_h = ( _reg_h >> 1 ) | ( _reg_h & 0x80 ); break; // ARHL
        case 0x11: _reg_e = ReadPC(); _reg_d = ReadPC(); break;
        case 0x12: WriteDE( _reg_a ); break;
        case 0x13: if ( ++_reg_e == 256 ) { _reg_e = 0; _reg_d++; _reg_d &= 0xff; } break;
        case 0x14: _reg_d = ALU_INR( _reg_d ); break;
        case 0x15: _reg_d = ALU_DCR( _reg_d ); break;
        case 0x16: _reg_d = ReadPC(); break;
        case 0x17: ALU_RAL(); break;
        case 0x18: Dummy(); Dummy(); t = _flag_cy; _flag_cy = ( _reg_d & 0x80 ) ? 1 : 0; _reg_d = ( _reg_d << 1 ) & 0xff | ( ( _reg_e & 0x80 ) ? 1 : 0 ); _reg_e = ( _reg_e << 1 ) & 0xff | ( t ? 1 : 0 ); _flag_v = _flag_cy ^ ( reg_d >> 7 ); break; // RDEL 
        case 0x19: Dummy(); Dummy(); _reg_l += _reg_e; _reg_h += _reg_d + ( _reg_l >> 8 ); _flag_cy = _reg_h >> 8; _reg_l &= 0xff; _reg_h &= 0xff; break;
        case 0x1a: _reg_a = ReadDE(); break;
        case 0x1b: if ( --_reg_e < 0 ) { _reg_e = 0xff; _reg_d--; _reg_d &= 0xff; } break;
        case 0x1c: _reg_e = ALU_INR( _reg_e ); break;
        case 0x1d: _reg_e = ALU_DCR( _reg_e ); break;
        case 0x1e: _reg_e = ReadPC(); break;
        case 0x1f: ALU_RAR(); break;
        case 0x20: _reg_a = RIM(); break;
        case 0x21: _reg_l = ReadPC(); _reg_h = ReadPC(); break;
        case 0x22: t = ReadPC16(); Write( t, _reg_l ); Write( t + 1, _reg_h ); break;
        case 0x23: if ( ++_reg_l == 256 ) { _reg_l = 0; _reg_h++; _reg_h &= 0xff; } break;
        case 0x24: _reg_h = ALU_INR( _reg_h ); break;
        case 0x25: _reg_h = ALU_DCR( _reg_h ); break;
        case 0x26: _reg_h = ReadPC(); break;
        case 0x27: ALU_DAA(); break;
        case 0x28: t = ReadPC(); Dummy(); _reg_e = _reg_l + t; _reg_d = _reg_h + ( _reg_e > 0xff ? 1 : 0 ); _reg_e &= 0xff; _reg_d &= 0xff; break; // LDHI
        case 0x29: Dummy(); Dummy(); _reg_l += _reg_l; _reg_h += _reg_h + ( _reg_l >> 8 ); _flag_cy = _reg_h >> 8; _reg_l &= 0xff; _reg_h &= 0xff; break;
        case 0x2a: t = ReadPC16(); _reg_l = Read( t ); _reg_h = Read( t + 1 ); break;
        case 0x2b: if ( --_reg_l < 0 ) { _reg_l = 0xff; _reg_h--; _reg_h &= 0xff; } break;
        case 0x2c: _reg_l = ALU_INR( _reg_l ); break;
        case 0x2d: _reg_l = ALU_DCR( _reg_l ); break;
        case 0x2e: _reg_l = ReadPC(); break;
        case 0x2f: _reg_a ^= 0xff; break;
        case 0x30: SIM( _reg_a ); break;
        case 0x31: _reg_sp = ReadPC16(); break;
        case 0x32: Write( ReadPC16(), _reg_a ); break;
        case 0x33: _reg_sp++; _reg_sp &= 0xffff; break;
        case 0x34: WriteHL( ALU_INR( ReadHL() ) ); break;
        case 0x35: WriteHL( ALU_DCR( ReadHL() ) ); break;
        case 0x36: WriteHL( ReadPC() ); break;
        case 0x37: _flag_cy = 1; break;
        case 0x38: t = ReadPC(); Dummy(); _reg_e = _reg_sp + t; _reg_d = _reg_e >> 8; _reg_e &= 0xff; _reg_d &= 0xff; break; // LDSI
        case 0x39: Dummy(); Dummy(); _reg_l += _reg_sp; _reg_h += _reg_l >> 8; _flag_cy = _reg_h >> 8; _reg_l &= 0xff; _reg_h &= 0xff; break;
        case 0x3a: _reg_a = Read( ReadPC16() ); break;
        case 0x3b: _reg_sp--; _reg_sp &= 0xffff; break;
        case 0x3c: _reg_a = ALU_INR( _reg_a ); break;
        case 0x3d: _reg_a = ALU_DCR( _reg_a ); break;
        case 0x3e: _reg_a = ReadPC(); break;
        case 0x3f: _flag_cy ^= 1; break;
        case 0x40: _reg_b = _reg_b; break;
        case 0x41: _reg_b = _reg_c; break;
        case 0x42: _reg_b = _reg_d; break;
        case 0x43: _reg_b = _reg_e; break;
        case 0x44: _reg_b = _reg_h; break;
        case 0x45: _reg_b = _reg_l; break;
        case 0x46: _reg_b = ReadHL(); break;
        case 0x47: _reg_b = _reg_a; break;
        case 0x48: _reg_c = _reg_b; break;
        case 0x49: _reg_c = _reg_c; break;
        case 0x4a: _reg_c = _reg_d; break;
        case 0x4b: _reg_c = _reg_e; break;
        case 0x4c: _reg_c = _reg_h; break;
        case 0x4d: _reg_c = _reg_l; break;
        case 0x4e: _reg_c = ReadHL(); break;
        case 0x4f: _reg_c = _reg_a; break;
        case 0x50: _reg_d = _reg_b; break;
        case 0x51: _reg_d = _reg_c; break;
        case 0x52: _reg_d = _reg_d; break;
        case 0x53: _reg_d = _reg_e; break;
        case 0x54: _reg_d = _reg_h; break;
        case 0x55: _reg_d = _reg_l; break;
        case 0x56: _reg_d = ReadHL(); break;
        case 0x57: _reg_d = _reg_a; break;
        case 0x58: _reg_e = _reg_b; break;
        case 0x59: _reg_e = _reg_c; break;
        case 0x5a: _reg_e = _reg_d; break;
        case 0x5b: _reg_e = _reg_e; break;
        case 0x5c: _reg_e = _reg_h; break;
        case 0x5d: _reg_e = _reg_l; break;
        case 0x5e: _reg_e = ReadHL(); break;
        case 0x5f: _reg_e = _reg_a; break;
        case 0x60: _reg_h = _reg_b; break;
        case 0x61: _reg_h = _reg_c; break;
        case 0x62: _reg_h = _reg_d; break;
        case 0x63: _reg_h = _reg_e; break;
        case 0x64: _reg_h = _reg_h; break;
        case 0x65: _reg_h = _reg_l; break;
        case 0x66: _reg_h = ReadHL(); break;
        case 0x67: _reg_h = _reg_a; break;
        case 0x68: _reg_l = _reg_b; break;
        case 0x69: _reg_l = _reg_c; break;
        case 0x6a: _reg_l = _reg_d; break;
        case 0x6b: _reg_l = _reg_e; break;
        case 0x6c: _reg_l = _reg_h; break;
        case 0x6d: _reg_l = _reg_l; break;
        case 0x6e: _reg_l = ReadHL(); break;
        case 0x6f: _reg_l = _reg_a; break;
        case 0x70: WriteHL( _reg_b ); break;
        case 0x71: WriteHL( _reg_c ); break;
        case 0x72: WriteHL( _reg_d ); break;
        case 0x73: WriteHL( _reg_e ); break;
        case 0x74: WriteHL( _reg_h ); break;
        case 0x75: WriteHL( _reg_l ); break;
        case 0x76: _halt = 1; break;
        case 0x77: WriteHL( _reg_a ); break;
        case 0x78: _reg_a = _reg_b; break;
        case 0x79: _reg_a = _reg_c; break;
        case 0x7a: _reg_a = _reg_d; break;
        case 0x7b: _reg_a = _reg_e; break;
        case 0x7c: _reg_a = _reg_h; break;
        case 0x7d: _reg_a = _reg_l; break;
        case 0x7e: _reg_a = ReadHL(); break;
        case 0x7f: _reg_a = _reg_a; break;
        case 0x80: ALU_ADD( _reg_b, 0, 0 ); break;
        case 0x81: ALU_ADD( _reg_c, 0, 0 ); break;
        case 0x82: ALU_ADD( _reg_d, 0, 0 ); break;
        case 0x83: ALU_ADD( _reg_e, 0, 0 ); break;
        case 0x84: ALU_ADD( _reg_h, 0, 0 ); break;
        case 0x85: ALU_ADD( _reg_l, 0, 0 ); break;
        case 0x86: ALU_ADD( ReadHL(), 0, 0 ); break;
        case 0x87: ALU_ADD( _reg_a, 0, 0 ); break;
        case 0x88: ALU_ADD( _reg_b, 0, 1 ); break;
        case 0x89: ALU_ADD( _reg_c, 0, 1 ); break;
        case 0x8a: ALU_ADD( _reg_d, 0, 1 ); break;
        case 0x8b: ALU_ADD( _reg_e, 0, 1 ); break;
        case 0x8c: ALU_ADD( _reg_h, 0, 1 ); break;
        case 0x8d: ALU_ADD( _reg_l, 0, 1 ); break;
        case 0x8e: ALU_ADD( ReadHL(), 0, 1 ); break;
        case 0x8f: ALU_ADD( _reg_a, 0, 1 ); break;
        case 0x90: ALU_SUB( _reg_b, 0, 0 ); break;
        case 0x91: ALU_SUB( _reg_c, 0, 0 ); break;
        case 0x92: ALU_SUB( _reg_d, 0, 0 ); break;
        case 0x93: ALU_SUB( _reg_e, 0, 0 ); break;
        case 0x94: ALU_SUB( _reg_h, 0, 0 ); break;
        case 0x95: ALU_SUB( _reg_l, 0, 0 ); break;
        case 0x96: ALU_SUB( ReadHL(), 0, 0 ); break;
        case 0x97: ALU_SUB( _reg_a, 0, 0 ); break;
        case 0x98: ALU_SUB( _reg_b, 0, 1 ); break;
        case 0x99: ALU_SUB( _reg_c, 0, 1 ); break;
        case 0x9a: ALU_SUB( _reg_d, 0, 1 ); break;
        case 0x9b: ALU_SUB( _reg_e, 0, 1 ); break;
        case 0x9c: ALU_SUB( _reg_h, 0, 1 ); break;
        case 0x9d: ALU_SUB( _reg_l, 0, 1 ); break;
        case 0x9e: ALU_SUB( ReadHL(), 0, 1 ); break;
        case 0x9f: ALU_SUB( _reg_a, 0, 1 ); break;
        case 0xa0: ALU_AND( _reg_b, 0 ); break;
        case 0xa1: ALU_AND( _reg_c, 0 ); break;
        case 0xa2: ALU_AND( _reg_d, 0 ); break;
        case 0xa3: ALU_AND( _reg_e, 0 ); break;
        case 0xa4: ALU_AND( _reg_h, 0 ); break;
        case 0xa5: ALU_AND( _reg_l, 0 ); break;
        case 0xa6: ALU_AND( ReadHL(), 0 ); break;
        case 0xa7: ALU_AND( _reg_a, 0 ); break;
        case 0xa8: ALU_XOR( _reg_b, 0 ); break;
        case 0xa9: ALU_XOR( _reg_c, 0 ); break;
        case 0xaa: ALU_XOR( _reg_d, 0 ); break;
        case 0xab: ALU_XOR( _reg_e, 0 ); break;
        case 0xac: ALU_XOR( _reg_h, 0 ); break;
        case 0xad: ALU_XOR( _reg_l, 0 ); break;
        case 0xae: ALU_XOR( ReadHL(), 0 ); break;
        case 0xaf: ALU_XOR( _reg_a, 0 ); break;
        case 0xb0: ALU_OR( _reg_b, 0 ); break;
        case 0xb1: ALU_OR( _reg_c, 0 ); break;
        case 0xb2: ALU_OR( _reg_d, 0 ); break;
        case 0xb3: ALU_OR( _reg_e, 0 ); break;
        case 0xb4: ALU_OR( _reg_h, 0 ); break;
        case 0xb5: ALU_OR( _reg_l, 0 ); break;
        case 0xb6: ALU_OR( ReadHL(), 0 ); break;
        case 0xb7: ALU_OR( _reg_a, 0 ); break;
        case 0xb8: ALU_CMP( _reg_b, 0 ); break;
        case 0xb9: ALU_CMP( _reg_c, 0 ); break;
        case 0xba: ALU_CMP( _reg_d, 0 ); break;
        case 0xbb: ALU_CMP( _reg_e, 0 ); break;
        case 0xbc: ALU_CMP( _reg_h, 0 ); break;
        case 0xbd: ALU_CMP( _reg_l, 0 ); break;
        case 0xbe: ALU_CMP( ReadHL(), 0 ); break;
        case 0xbf: ALU_CMP( _reg_a, 0 ); break;
        case 0xc0: if ( !_flag_z ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xc1: _reg_c = ReadSP(); _reg_b = ReadSP(); break;
        case 0xc2: if ( !_flag_z ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xc3: _reg_pc = ReadPC16(); break;
        case 0xc4: if ( !_flag_z ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xc5: WriteSP( _reg_b ); WriteSP( _reg_c ); break;
        case 0xc6: ALU_ADD( ReadPC(), 0, 0 ); break;
        case 0xc7: WriteSP16( _reg_pc ); _reg_pc = 0x0000; break;
        case 0xc8: if ( _flag_z ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xc9: _reg_pc = ReadSP16(); break;
        case 0xca: if ( _flag_z ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xcb: if ( _flag_v ) { WriteSP16( _reg_pc ); _reg_pc = 0x0040; _phases += 6 + _delay * 2 } break; // -
        case 0xcc: if ( _flag_z ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xcd: t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; break;
        case 0xce: ALU_ADD( ReadPC(), 0, 1 ); break;
        case 0xcf: WriteSP16( _reg_pc ); _reg_pc = 0x0008; break;
        case 0xd0: if ( !_flag_cy ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xd1: _reg_e = ReadSP(); _reg_d = ReadSP(); break;
        case 0xd2: if ( !_flag_cy ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xd3: WriteIO( ReadPC(), _reg_a ); break;
        case 0xd4: if ( !_flag_cy ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xd5: WriteSP( _reg_d ); WriteSP( _reg_e ); break;
        case 0xd6: ALU_SUB( ReadPC(), 0, 0 ); break;
        case 0xd7: WriteSP16( _reg_pc ); _reg_pc = 0x0010; break;
        case 0xd8: if ( _flag_cy ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xd9: WriteDEX( ( _reg_h << 8 ) | _reg_l ); break; // SHLX
        case 0xda: if ( _flag_cy ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xdb: _reg_a = ReadIO( ReadPC() ); break;
        case 0xdc: if ( _flag_cy ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xdd: if ( !_flag_x5 ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break; // JNX5
        case 0xde: ALU_SUB( ReadPC(), 0, 1 ); break;
        case 0xdf: WriteSP16( _reg_pc ); _reg_pc = 0x0018; break;
        case 0xe0: if ( !_flag_p ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xe1: _reg_l = ReadSP(); _reg_h = ReadSP(); break;
        case 0xe2: if ( !_flag_p ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xe3: t = ( _reg_h << 8 ) | _reg_l; _reg_l = ReadSP(); _reg_h = ReadSP(); WriteSP16( t ); break;
        case 0xe4: if ( !_flag_p ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xe5: WriteSP( _reg_h ); WriteSP( _reg_l ); break;
        case 0xe6: ALU_AND( ReadPC(), 0 ); break;
        case 0xe7: WriteSP16( _reg_pc ); _reg_pc = 0x0020; break;
        case 0xe8: if ( _flag_p ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xe9: _reg_pc = ( _reg_h << 8 ) | _reg_l; break;
        case 0xea: if ( _flag_p ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xeb: t = _reg_l; _reg_l = _reg_e; _reg_e = t; t = _reg_h; _reg_h = _reg_d; _reg_d = t; break;
        case 0xec: if ( _flag_p ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xed: t = ReadDEX(); _reg_l = t & 0xff; _reg_h = t >> 8; break; // LHLX
        case 0xee: ALU_XOR( ReadPC(), 0 ); break;
        case 0xef: WriteSP16( _reg_pc ); _reg_pc = 0x0028; break;
        case 0xf0: if ( !_flag_s ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xf1: SetFlags( ReadSP() ); _reg_a = ReadSP(); break;
        case 0xf2: if ( !_flag_s ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xf3: _inte = 0; __inte = 0; _rdinte = 0; break;
        case 0xf4: if ( !_flag_s ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xf5: WriteSP( _reg_a ); WriteSP( GetFlags() ); break;
        case 0xf6: ALU_OR( ReadPC(), 0 ); break;
        case 0xf7: WriteSP16( _reg_pc ); _reg_pc = 0x0030; break;
        case 0xf8: if ( _flag_s ) { _reg_pc = ReadSP16(); _phases += 6 + _delay * 2; } break;
        case 0xf9: _reg_sp = ( _reg_h << 8 ) | _reg_l; break;
        case 0xfa: if ( _flag_s ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break;
        case 0xfb: _inte = 1; _rdinte = 1; break;
        case 0xfc: if ( _flag_s ) { t = ReadPC16(); WriteSP16( _reg_pc ); _reg_pc = t; _phases += 9 + _delay * 3; } else ReadPC16NC(); break;
        case 0xfd: if ( _flag_x5 ) { _reg_pc = ReadPC16(); _phases += 3 + _delay; } else ReadPC16NC(); break; // JX5
        case 0xfe: ALU_CMP( ReadPC(), 0 ); break;
        case 0xff: WriteSP16( _reg_pc ); _reg_pc = 0x0038; break;
    }
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dasm_instruction( addr ) {
    var code = _mem[ addr ];
    if ( code == undefined ) return undefined;
    var ins = instrs[ code ];
    ins = ins.replace( / /g, " " );
    var dat = " " + hex4( addr ) + "  [" + hex2( code );
    if ( ins.match( '@1' ) ) {
        ins = ins.replace( '@1', hex2( _mem[ addr + 1 ] | 0 ) );
        dat += " " + hex2( _mem[ addr + 1 ] | 0 ) + "   ]  ";
    } else if ( ins.match( '@2' ) ) {
        ins = ins.replace( '@2', hex4( ( ( _mem[ addr + 2 ] | 0 ) << 8 ) | ( _mem[ addr + 1 ] | 0 ) ) );
        dat += " " + hex2( _mem[ addr + 1 ] | 0 ) + " " + hex2( _mem[ addr + 2 ] | 0 ) + "]  ";
    } else {
        dat += "      ]  ";
    }
    return dat + ins;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function disassembly() {
    _codes = new Array;
//    for ( var addr = 0; addr < 3; addr++ ) {
    for ( var addr = 0; addr < 65536; addr++ ) {
        var code = _mem[ addr ];
        if ( code == undefined ) continue;
        var ins = instrs[ code ];
        ins = ins.replace( / /g, " " );
        var dat = " " + hex4( addr ) + "  [" + hex2( code );
        if ( ins.match( '@1' ) ) {
            ins = ins.replace( '@1', hex2( _mem[ addr + 1 ] | 0 ) );
            dat += " " + hex2( _mem[ addr + 1 ] | 0 ) + "   ]  ";
        } else if ( ins.match( '@2' ) ) {
            ins = ins.replace( '@2', hex4( ( ( _mem[ addr + 2 ] | 0 ) << 8 ) | ( _mem[ addr + 1 ] | 0 ) ) );
            dat += " " + hex2( _mem[ addr + 1 ] | 0 ) + " " + hex2( _mem[ addr + 2 ] | 0 ) + "]  ";
        } else {
            dat += "      ]  ";
        }
//>ins = ins.replace(/\[/, '<span style="color:red">').replace(/\]/,'</span>');
//>ins = ins.replace(/\[/, '<span style="color:red">');
//>alert (ins);
        _codes[ addr ] = dat + ins;
    }
}//]

//---------------------------------------------------------------Read/Write-//[
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function Dummy() {
    update_bus();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function Read( index ) {
    var d = moduleMemoryRead( index );
    if ( d === null || d === undefined ) d = _mem[ index ] || 0x00;
    update_bus( index, d, 0, 1, 0 );
    return d;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function Write( index, value ) {
    _mem[ index ] = value;
    update_bus( index, value, 1, 0, 0 );
    update_memory( index, value );
    moduleMemoryWrite( index, value );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadPC() {
    var val = Read( _reg_pc++ );
    if ( _reg_pc > 65535 ) _reg_pc = 0;
    return val;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadPC16() { return ReadPC() | ( ReadPC() << 8 ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadPC16NC() {
    Read( _reg_pc );
    _reg_pc = ( _reg_pc + 2 ) & 0xffff;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadSP() {
    var val = Read( _reg_sp++ );
    if ( _reg_sp > 65535 ) _reg_sp = 0;
    return val;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteSP( value ) {
    if ( --_reg_sp < 0 ) _reg_sp = 65535;
    Write( _reg_sp, value );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadSP16() { return ReadSP() | ( ReadSP() << 8 ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteSP16( value ) { WriteSP( (value >> 8) & 0xff ); WriteSP( value & 0xff ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadBC() { return Read( ( _reg_b << 8 ) | _reg_c ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteBC( value ) { Write( ( _reg_b << 8 ) | _reg_c, value ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadDE() { return Read( ( _reg_d << 8 ) | _reg_e ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadDEX() {
    var a = ( _reg_d << 8 ) | _reg_e;
    return Read( a ) | ( Read( ( a + 1 ) & 0xffff ) << 8 );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteDE( value ) { Write( ( _reg_d << 8 ) | _reg_e, value ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteDEX( value ) {
    var a = ( _reg_d << 8 ) | _reg_e;
    Write( a, value & 0xff );
    Write( ( a + 1 ) & 0xffff, value >> 8 );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadHL() { return Read( ( _reg_h << 8 ) | _reg_l ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteHL( value ) { Write( ( _reg_h << 8 ) | _reg_l, value ) }//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ReadIO( index ) {
    var d = moduleIORead( index );
    if ( d === null || d === undefined ) d = _ior[ index ] || 0x00;
    update_bus( ( index << 8 ) | index, d, 0, 1, 1 );
    return d;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function WriteIO( index, value ) {
    update_bus( ( index << 8 ) | index, value, 1, 0, 1 );
    _iow[ index ] = value;
    moduleIOWrite( index, value );
}//]
//]

//----------------------------------------------------------------------ALU-//[
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_ADD( value, flagmask, adc ) {
    if ( !( flagmask & 0x10 ) ) {
        _flag_ac = ( ( _reg_a & 0xf ) + ( value & 0xf ) + ( adc & _flag_cy ) ) > 0xf ? 1 : 0;
    }
    _reg_a += value + ( adc & _flag_cy );
    if ( !( flagmask & 0x01 ) ) _flag_cy = _reg_a > 0xff ? 1 : 0;
    _reg_a &= 0xff;
    ALUSetFlags();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_SUB( value, flagmask, adc ) {
    if ( !( flagmask & 0x10 ) ) { // TODO AY???
        _flag_ac = ( ( _reg_a & 0xf ) - ( value & 0xf ) - ( adc & _flag_cy ) ) < 0 ? 1 : 0;
    }
    _reg_a -= value + ( adc & _flag_cy );
    if ( !( flagmask & 0x01 ) ) _flag_cy = _reg_a < 0 ? 1 : 0;
    _reg_a &= 0xff;
    ALUSetFlags();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_AND( value, flagmask ) {
    if ( !( flagmask & 0x10 ) ) _flag_ac = 1; //???
    if ( !( flagmask & 0x01 ) ) _flag_cy = 0;
    _reg_a &= value;
    ALUSetFlags();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_OR( value, flagmask ) {
    if ( !( flagmask & 0x10 ) ) _flag_ac = 0;
    if ( !( flagmask & 0x01 ) ) _flag_cy = 0;
    _reg_a |= value;
    ALUSetFlags();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_XOR( value, flagmask ) {
    if ( !( flagmask & 0x10 ) ) _flag_ac = 0;
    if ( !( flagmask & 0x01 ) ) _flag_cy = 0;
    _reg_a ^= value;
    ALUSetFlags();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_CMP( value, flagmask ) {
    var a = _reg_a;
    ALU_SUB( value, flagmask );
    _reg_a = a;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_INR( value ) {
    var t = _reg_a;
    _reg_a = value;
    ALU_ADD( 1, 0x01, 0 );
    var rv = _reg_a;
    _reg_a = t;
    return rv;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_DCR( value ) {
    var t = _reg_a;
    _reg_a = value;
    ALU_SUB( 1, 0x01, 0 );
    var rv = _reg_a;
    _reg_a = t;
    return rv;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_DAA() {
    if ( _flag_ac || ( _reg_a & 0xf ) > 9 ) _reg_a += 0x06;
//>    if ( _flag_ac ) _reg_a -= 0x10;
    if ( _flag_cy || _reg_a > 0x9f ) _reg_a += 0x60;
    _flag_cy |= ( _reg_a > 0xff ? 1 : 0 );
    _reg_a &= 0xff;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_RLC() {
    _flag_cy = _reg_a & 0x80 ? 1 : 0;
    _reg_a = ( _reg_a << 1 ) & 0xff | _flag_cy;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_RRC() {
    _flag_cy = _reg_a & 0x01;
    _reg_a = ( _reg_a >> 1 ) | ( _flag_cy ? 0x80 : 0x00 );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_RAL() {
    var cy = _reg_a & 0x80 ? 1 : 0;
    _reg_a = ( _reg_a << 1 ) & 0xff | _flag_cy;
    _flag_cy = cy;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALU_RAR() {
    var cy = _reg_a & 0x01;
    _reg_a = ( _reg_a >> 1 ) | ( _flag_cy ? 0x80 : 0x00 );
    _flag_cy = cy;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function ALUSetFlags( flagmask ) {
    if ( !( flagmask & 0x40 ) ) _flag_z = _reg_a ? 0 : 1;
    if ( !( flagmask & 0x80 ) ) _flag_s = _reg_a & 0x80 ? 1 : 0;
    if ( !( flagmask & 0x04 ) ) {
        _flag_p =
            ( !!(_reg_a & 0x01) ^ !!(_reg_a & 0x02) ^ !!(_reg_a & 0x04) ^ !!(_reg_a & 0x08) ^ !!(_reg_a & 0x10) ^ !!(_reg_a & 0x20) ^ !!(_reg_a & 0x40) ^ !!(_reg_a & 0x80) ) 
            ? 0 : 1;
    }
}//]
//]

//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function SetFlags( value ) {
    _flag_cy = value & 0x01 ? 1 : 0;
    _flag_z  = value & 0x40 ? 1 : 0;
    _flag_p  = value & 0x04 ? 1 : 0;
    _flag_s  = value & 0x80 ? 1 : 0;
    _flag_ac = value & 0x10 ? 1 : 0;
    // undocumented flags
    _flag_v  = value & 0x02 ? 1 : 0;
    _flag_x5 = value & 0x20 ? 1 : 0;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function GetFlags() {
    return _flag_cy | ( _flag_z << 6 ) | ( _flag_p << 2 ) | ( _flag_s << 7 ) | ( _flag_ac << 4 )
        | ( _flag_v << 1 ) | ( _flag_x5 << 5 ); // undocumented flags
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function RIM() {
    return _rst5_5_mask | ( _rst6_5_mask << 1 ) | ( _rst7_5_mask << 2 ) | ( _rdinte << 3 ) |
        ( _rst5_5 << 4 ) | ( _rst6_5 << 5 ) | ( _rst7_5 << 6 ) | ( _sid << 7 );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function SIM( value ) {
    if ( value & 0x08 ) {
        _rst5_5_mask = value & 0x01;
        _rst6_5_mask = value & 0x02 ? 1 : 0;
        _rst7_5_mask = value & 0x04 ? 1 : 0;
    }
    if ( value & 0x10 ) {
        _rst7_5_ff = 0;
        __rst7_5_iff = 0;
    }
    if ( value & 0x40 ) _sod = value & 0x80 ? 1 : 0;
}//]
//]

//------------------------------------------------------------------Display-//[
//---------------------------------------------------------------Converters-//[
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function hex2( value ) {
    return "0123456789ABCDEF".charAt( ( value >> 4 ) & 0xf ) + "0123456789ABCDEF".charAt( value & 0xf );
//>    return ("0123456789ABCDEF")[ ( value >> 4 ) & 0xf ] + ("0123456789ABCDEF")[ value & 0xf ];
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function hex4( value ) {
    return "0123456789ABCDEF".charAt( ( value >> 12 ) & 0xf ) + "0123456789ABCDEF".charAt( ( value >> 8 ) & 0xf ) + "0123456789ABCDEF".charAt( ( value >> 4 ) & 0xf ) + "0123456789ABCDEF".charAt( value & 0xf );
//>    return "0123456789ABCDEF"[ ( value >> 12 ) & 0xf ] + "0123456789ABCDEF"[ ( value >> 8 ) & 0xf ] + "0123456789ABCDEF"[ ( value >> 4 ) & 0xf ] + "0123456789ABCDEF"[ value & 0xf ];
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function bin8( value ) {
    return ( value & 0x80 ? "1" : "0" ) + ( value & 0x40 ? "1" : "0" ) + ( value & 0x20 ? "1" : "0" ) + ( value & 0x10 ? "1" : "0" ) + ( value & 0x08 ? "1" : "0" ) + ( value & 0x04 ? "1" : "0" ) + ( value & 0x02 ? "1" : "0" ) + ( value & 0x01 ? "1" : "0" );
}//]
//]

//-------------------------------------------------------------HTML Buttons-//[
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function config() {
    dlg_config_show();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function reset() {
    var msg = document.getElementById( "message" );
    msg.style.display = "";
    msg.innerHTML = "Please, wait...";
//>    modulesReset();
    setTimeout( "modulesReset();reset_main()", 1 );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function reset_main() {
    _reg_a = 0; _reg_b = 0; _reg_c = 0; _reg_d = 0; _reg_e = 0; _reg_h = 0; _reg_l = 0;
    _flag_cy = 0; _flag_z = 0; _flag_p = 0; _flag_s = 0; _flag_ac = 0;
    _reg_pc = 0; _reg_sp = 0;
    _halt = 0; _inte = 0; _rdinte = 0;
    _rst5_5_mask = 0; _rst6_5_mask = 0; _rst7_5_mask = 0; _rst5_5 = 0; _rst6_5 = 0; _rst7_5 = 0; _sid = 0;
    _rst7_5_ff = 0; _sod = 0; _trap = 0; _int = 0;
    _phases = 0;
    _mem = new Array;
    for ( i in init_mem ) _mem[ i ] = init_mem[ i ];
    _ior = new Array;
    for ( i in init_ior ) _ior[ i ] = init_ior[ i ];
    _iow = new Array;
    for ( i in init_iow ) _iow[ i ] = init_iow[ i ];

    __inte = 0; __rst7_5_iff = 0; __trap = 0;

    var bd = document.getElementById( "busdata" );
    for ( i = bd.childNodes.length - 1; i >= 0; i-- ) bd.removeChild( bd.childNodes[i] );
    
    disassembly();
    update();
    if ( mem_string == undefined ) {
        mem_string = "";
        for ( var i = 0; i < 65536; i++ ) {
//>        for ( var i = 0; i < 1024; i++ ) {
            if ( !( i & 0x0007 ) ) mem_string += " " + hex4(i) + " -";
            mem_string += " " + hex2( _mem[ i ] | 0 );
            if ( ( i & 0x0007 ) == 0x0007 ) mem_string += nl;
        }
    }
    __mem_string = mem_string;
    document.getElementById( "memory" ).replaceChild( document.createTextNode( mem_string ), document.getElementById( "memory" ).childNodes[0] );
    //document.getElementById( "memory" ).innerHTML = mem_string;
    var msg = document.getElementById( "message" );
    msg.style.display = "none";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function run() {
    _running = 1;
    $( 'btn_stop' ).enable();
    if ( _followCode ) runFollowed();
    else runFull();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function runFull() {
    var execCnt = yieldTime;
    while ( !_halt && _running && execCnt ) {
        exec_instruction();
        --execCnt;
    }
    if ( !_halt && _running ) setTimeout( "runFull()", 1 );
    else { 
        update();
        $( 'btn_stop' ).disable();
    }
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function runFollowed() {
    if ( !_halt && _running ) {
        exec_instruction();
        update();
        setTimeout( 'runFollowed()', 1 );
    } else $( 'btn_stop' ).disable();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function stop() {
    _running = 0;
//>    $( 'btn_stop' ).disable();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function stepInstruction() {
    exec_instruction();
    update();
}//]
//]

//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function update() {
    document.getElementById( "blk_bus_activity" ).style.display = _busActivity ? "" : "none";
    document.getElementById( "reg_a" ).value = hex2( _reg_a );
    document.getElementById( "reg_b" ).value = hex2( _reg_b );
    document.getElementById( "reg_c" ).value = hex2( _reg_c );
    document.getElementById( "reg_d" ).value = hex2( _reg_d );
    document.getElementById( "reg_e" ).value = hex2( _reg_e );
    document.getElementById( "reg_h" ).value = hex2( _reg_h );
    document.getElementById( "reg_l" ).value = hex2( _reg_l );
    document.getElementById( "flag_cy" ).value = _flag_cy;
    document.getElementById( "flag_z" ).value  = _flag_z;
    document.getElementById( "flag_p" ).value  = _flag_p;
    document.getElementById( "flag_s" ).value  = _flag_s;
    document.getElementById( "flag_ac" ).value = _flag_ac;
    document.getElementById( "reg_pc" ).value = hex4( _reg_pc );
    document.getElementById( "reg_sp" ).value = hex4( _reg_sp );
    document.getElementById( "inte" ).value = _inte; // maybe _rdinte -> RIM
    document.getElementById( "rst5_5" ).value = _rst5_5;
    document.getElementById( "rst6_5" ).value = _rst6_5;
    document.getElementById( "rst7_5" ).value = _rst7_5;
    document.getElementById( "rst5_5_mask" ).value = _rst5_5_mask;
    document.getElementById( "rst6_5_mask" ).value = _rst6_5_mask;
    document.getElementById( "rst7_5_mask" ).value = _rst7_5_mask;
    document.getElementById( "rst7_5_ff" ).value = _rst7_5_ff;
    document.getElementById( "trap" ).value = _trap;
    document.getElementById( "int" ).value = _int;
    document.getElementById( "sid" ).value = _sid;
    document.getElementById( "sod" ).value = _sod;
    document.getElementById( "elapsed_phases" ).value = _phases;
    document.getElementById( "elapsed_time" ).value = Math.round(_phases / _cpuFreq*100)/100;

    var tmp;
    var attr;

    var sp = _reg_sp;
    var cont = document.getElementById( "stack" );
    cont.innerHTML = "";
    for ( var i = 0; i < _stackSize - 1; i++ ) {
        cont.appendChild( tmp = document.createElement( "div" ) );
        if ( !i ) {
            tmp.setAttributeNode( attr = document.createAttribute( "class" ) );
            attr.nodeValue = "hl";
        }
        tmp.appendChild( document.createTextNode( " " + hex4( ( _mem[ sp + 1 ] << 8 ) | _mem[ sp ] ) ) );
        sp = ( sp + 2 ) & 0xffff;
    }

    tmp = "";
    for ( var i = 0; i < 256; i++ ) tmp += " " + hex2( i ) + " - " + hex2( _ior[ i ] | 0 ) + nl;
    document.getElementById( "input" ).replaceChild( document.createTextNode( tmp ), document.getElementById( "input" ).childNodes[0] );
    tmp = "";
    for ( var i = 0; i < 256; i++ ) tmp += " " + hex2( i ) + " - " + hex2( _iow[ i ] | 0 ) + nl;
    document.getElementById( "output" ).replaceChild( document.createTextNode( tmp ), document.getElementById( "output" ).childNodes[0] );

    var pc = _codeStartPC ? _reg_pc : _codeStart;
    var cont = document.getElementById( "code" );
    cont.innerHTML = "";
    for ( var i = 0; i < _codeSize; i++ ) {
        cont.appendChild( tmp = document.createElement( "div" ) );
        if ( pc == _reg_pc ) {
            tmp.setAttributeNode( attr = document.createAttribute( "class" ) );
            attr.nodeValue = "hl";
        }
        if ( _codes[ pc ] ) {
            tmp.appendChild( document.createTextNode( _codes[ pc ] ) );
            pc += lengths[ _mem[ pc ] ];
        } else {
            tmp.appendChild( document.createTextNode( " " + hex4( pc++ ) + "  [00      ]  NOP" ) );
        }
    }
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function update_bus(addr, data, rd, wr, iom) {
    if ( !_busActivity ) return;
    var tr = document.createElement("tr");
    var td;

    if ( addr == undefined ) {
        tr.appendChild( td = document.createElement("td") );
        td.appendChild( document.createTextNode( '####' ) );
        tr.appendChild( td = document.createElement("td") );
        td.appendChild( document.createTextNode( '##' ) );
        rd = 1; wr = 1; iom = 0;
    } else {
        tr.appendChild( td = document.createElement("td") );
        td.appendChild( document.createTextNode( hex4(addr) ) );
        tr.appendChild( td = document.createElement("td") );
        td.appendChild( document.createTextNode( hex2(data) ) );
    }
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( rd ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( wr ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( iom ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_a) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_b) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_c) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_d) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_e) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_h) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex2(_reg_l) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( bin8(GetFlags()) ) );
    tr.appendChild( td = document.createElement("td") );
    td.appendChild( document.createTextNode( hex4(_reg_sp) ) );
    
    document.getElementById( "busdata" ).appendChild(tr);
//    var row = "<tr><td>"+hex4(addr)+"</td><td>"+hex2(data)+"</td><td>"+rd+"</td><td>"+wr+"</td><td>"+iom+"</td><td>"+hex2(_reg_a)+"</td><td>"+hex2(_reg_b)+"</td><td>"+hex2(_reg_c)+"</td><td>"+hex2(_reg_d)+"</td><td>"+hex2(_reg_e)+"</td><td>"+hex2(_reg_h)+"</td><td>"+hex2(_reg_l)+"</td><td>"+bin8(GetFlags())+"</td><td>"+hex4(_reg_sp)+"</td></tr>";
//    document.getElementById( "busdata" ).innerHTML += row;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function update_memory( address, value ) {
    var o = document.getElementById( "memory" );
    p = ( address & 7 ) * 3 + 8 + ( address >> 3 ) * 32;
//    p = ( address & 7 ) * 8 + 28 + ( address >> 3 ) * 92;
    __mem_string = __mem_string.substring(0, p) + hex2(value) + __mem_string.substring(p+2);
    document.getElementById( "memory" ).replaceChild( document.createTextNode( __mem_string ), document.getElementById( "memory" ).childNodes[0] );
    _codes[ address ] = dasm_instruction( address );
    address--; address &= 0xffff;
    _codes[ address ] = dasm_instruction( address );
    address--; address &= 0xffff;
    _codes[ address ] = dasm_instruction( address );
}//]

//------------------------------------------------------------------Dialogs-//[
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_memory_show() {
    document.getElementById( "set_memory" ).style.display = "";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_memory_cancel() {
    document.getElementById( "set_memory" ).style.display = "none";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_memory_ok() {
    var address = parseInt( "0x" + document.getElementById( "set_memory_address" ).value ) & 0xffff;
    var value = parseInt( "0x" + document.getElementById( "set_memory_value" ).value ) & 0xff;
    _mem[ address ] = value;
    update_memory( address, value );
    document.getElementById( "set_memory" ).style.display = "none";
    update();
}//]

//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_input_show() {
    document.getElementById( "set_input" ).style.display = "";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_input_cancel() {
    document.getElementById( "set_input" ).style.display = "none";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_input_ok() {
    var address = parseInt( "0x" + document.getElementById( "set_input_address" ).value ) & 0xff;
    var value = parseInt( "0x" + document.getElementById( "set_input_value" ).value ) & 0xff;
    _ior[ address ] = value;
    document.getElementById( "set_input" ).style.display = "none";
    update();
}//]

//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_output_show() {
    document.getElementById( "set_output" ).style.display = "";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_output_cancel() {
    document.getElementById( "set_output" ).style.display = "none";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_set_output_ok() {
    var address = parseInt( "0x" + document.getElementById( "set_output_address" ).value ) & 0xff;
    var value = parseInt( "0x" + document.getElementById( "set_output_value" ).value ) & 0xff;
    _iow[ address ] = value;
    document.getElementById( "set_output" ).style.display = "none";
    update();
}//]

//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_config_show() {
    document.getElementById( "config_cpu_freq" ).value = _cpuFreq;
    document.getElementById( "config_delay" ).value = _delay;
    document.getElementById( "config_code_start" ).value = hex4( _codeStart );
    document.getElementById( "config_code_size" ).value = _codeSize;
    document.getElementById( "config_stack_size" ).value = _stackSize;
    dlg_config_show_cs( _codeStartPC );
    document.getElementById( "config_bus_activity" ).checked = _busActivity ? true : false;
    document.getElementById( "dlg_config" ).style.display = "";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_config_cancel() {
    document.getElementById( "dlg_config" ).style.display = "none";
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_config_toggle_pc() {
    dlg_config_show_cs( ( document.getElementById( "config_pc" ).value == "PC" ) ? 0 : 1 );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_config_show_cs( value ) {
    document.getElementById( "config_pc" ).value = value ? "PC" : "";
    var cs = document.getElementById( "config_code_start" );
    if ( value ) {
        cs.style.background = "#aad";
        cs.style.color = "#448";
        cs.readOnly = true;
    } else {
        cs.style.background = "white";
        cs.style.color = "black";
        cs.readOnly = false;
    }
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function dlg_config_ok() {
    _cpuFreq = document.getElementById( "config_cpu_freq" ).value;
    _delay = parseInt( document.getElementById( "config_delay" ).value, 10 );
    _codeStart = parseInt( "0x" + document.getElementById( "config_code_start" ).value ) & 0xffff;
    _codeSize = document.getElementById( "config_code_size" ).value;
    _stackSize = document.getElementById( "config_stack_size" ).value;
    _codeStartPC = ( document.getElementById( "config_pc" ).value == "PC" ) ? 1 : 0;
    _busActivity = document.getElementById( "config_bus_activity" ).checked ? 1 : 0;
    _followCode = document.getElementById( "follow_code" ).checked ? 1 : 0;
    document.getElementById( "dlg_config" ).style.display = "none";
    update();
}//]
//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function toggleFlag( flag ) {
    eval( "_" + flag + " ^= 1" );
    if ( flag == "rst7_5_ff" ) __rst7_5_iff = 0;
    if ( flag == "rst7_5" && _rst7_5 && !_rst7_5_ff ) {
        __rst7_5_iff = 0;
        _rst7_5_ff = 1;
    }
    if ( flag == 'inte' ) {
        _rdinte = _inte;
        __inte = _inte;
    }
    update();
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function set( reg ) {
    var v = parseInt( "0x" + document.getElementById( reg ).value );
    if ( reg == "reg_sp" || reg == "reg_pc" ) v &= 0xffff;
    else v &= 0xff;
    eval( "_" + reg + " = v" );
    update();    
}//]
//]

//------------------------------------------------------------------Modules-//[
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function registerModule( module ) {
    modules.push( module );
    module.initialize();
    // for efficiency
    if ( module.memoryWrite ) modulesMWR.push( module.memoryWrite );
    if ( module.memoryRead ) modulesMRD.push( module.memoryRead );
    if ( module.ioWrite ) modulesIOWR.push( module.ioWrite );
    if ( module.ioRead ) modulesIORD.push( module.ioRead );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function moduleMemoryRead( index ) {
    var v = modulesMRD.find( function( m ) {
        var v = m( index );
        if ( v === null || v === undefined ) return false;
        return v + 1;
    } );
    if ( v ) return v - 1;
    return null;    
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function moduleMemoryWrite( index, value ) {
    modulesMWR.each( function( m ) { m( index, value ) } );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function moduleIORead( index ) {
    var v = null;
    modulesIORD.find( function( m ) {
        v = m( index );
        if ( v === null || v === undefined ) return false;
        return true;
    } );
    return v;
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function moduleIOWrite( index, value ) {
    modulesIOWR.each( function( m ) { m( index, value ) } );
}//]
//--------------------------------------------------------------------------//[
/// <description>TODO</description>
function modulesReset( index, value ) {
    modules.each( function( m ) { m.reset() } );
}//]
//]

