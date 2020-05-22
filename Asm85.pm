#!/usr/bin/perl
#-----------------------------------------------------------------------info-#[
## <info> TODO
## </info>
# v1.1 -> intel's undocumented features
#----------------------------------------------------------------------------#]
use strict;
use warnings;
no warnings qw/once/;

# TODO   ADI ~0x04
# TODO no compilation if only one instruction?

#============================================================================#[
## <description>TODO</description>
{
package I8085;

# operands:
# none
# reg: A, B, C, D, E, H, L, M
# double reg: "A,A", ...
# rp: B, D, H, SP
# rpbd: B, D
# rppsw: B, D, H, PSW
# data, data16, data3, addr, port

# 24 + 2 + 8 + 46 = 80 instr
%I8085::instructions = (#[
    MOV => { mc => 0x40, op => "dreg" },
    MVI => { mc => 0x06, op => "reg8data" },
    LXI => { mc => 0x01, op => "rpdata" },
    LDA => { mc => 0x3A, op => "addr" },
    STA => { mc => 0x32, op => "addr" },
    LHLD => { mc => 0x2A, op => "addr" },
    SHLD => { mc => 0x22, op => "addr" },
    LDAX => { mc => 0x0A, op => "rpbd" },
    STAX => { mc => 0x02, op => "rpbd" },
    XCHG => { mc => 0xEB },
   
    ADD => { mc => 0x80, op => "reg" },
    ADC => { mc => 0x88, op => "reg" },
    ADI => { mc => 0xC6, op => "data" },
    ACI => { mc => 0xCE, op => "data" },
    SUB => { mc => 0x90, op => "reg" },
    SBB => { mc => 0x98, op => "reg" },
    SUI => { mc => 0xD6, op => "data" },
    SBI => { mc => 0xDE, op => "data" },
    INR => { mc => 0x04, op => "reg8" },
    DCR => { mc => 0x05, op => "reg8" },
    INX => { mc => 0x03, op => "rp" },
    DCX => { mc => 0x0B, op => "rp" },
    DAD => { mc => 0x09, op => "rp" },
    DAA => { mc => 0x27 },
   
    ANA => { mc => 0xA0, op => "reg" },
    ANI => { mc => 0xE6, op => "data" },
    XRA => { mc => 0xA8, op => "reg" },
    XRI => { mc => 0xEE, op => "data" },
    ORA => { mc => 0xB0, op => "reg" },
    ORI => { mc => 0xF6, op => "data" },
    CMP => { mc => 0xB8, op => "reg" },
    CPI => { mc => 0xFE, op => "data" },
    CMA => { mc => 0x2F },
    CMC => { mc => 0x3F },
    STC => { mc => 0x37 },
    RRC => { mc => 0x0F },
    RLC => { mc => 0x07 },
    RAR => { mc => 0x1F },
    RAL => { mc => 0x17 },
   
    JMP => { mc => 0xC3, op => "addr" },
    JNZ => { mc => 0xC2, op => "addr" },
    JZ => { mc => 0xCA, op => "addr" },
    JNC => { mc => 0xD2, op => "addr" },
    JC => { mc => 0xDA, op => "addr" },
    JPO => { mc => 0xE2, op => "addr" },
    JPE => { mc => 0xEA, op => "addr" },
    JP => { mc => 0xF2, op => "addr" },
    JM => { mc => 0xFA, op => "addr" },
    CALL => { mc => 0xCD, op => "addr" },
    CNZ => { mc => 0xC4, op => "addr" },
    CZ => { mc => 0xCC, op => "addr" },
    CNC => { mc => 0xD4, op => "addr" },
    CC => { mc => 0xDC, op => "addr" },
    CPO => { mc => 0xE4, op => "addr" },
    CPE => { mc => 0xEC, op => "addr" },
    CP => { mc => 0xF4, op => "addr" },
    CM => { mc => 0xFC, op => "addr" },
    RET => { mc => 0xC9 },
    RNZ => { mc => 0xC0 },
    RZ => { mc => 0xC8 },
    RNC => { mc => 0xD0 },
    RC => { mc => 0xD8 },
    RPO => { mc => 0xE0 },
    RPE => { mc => 0xE8 },
    RP => { mc => 0xF0 },
    RM => { mc => 0xF8 },
    RST => { mc => 0xC7, op => "data3" },
    PCHL => { mc => 0xE9 },

    PUSH => { mc => 0xC5, op => "rppsw" },
    POP => { mc => 0xC1, op => "rppsw" },
    XTHL => { mc => 0xE3 },
    SPHL => { mc => 0xF9 },
    IN => { mc => 0xDB, op => "port" },
    OUT => { mc => 0xD3, op => "port" },
    EI => { mc => 0xFB },
    DI => { mc => 0xF3 },
    HLT => { mc => 0x76 },
    NOP => { mc => 0x00 },
    RIM => { mc => 0x20 },
    SIM => { mc => 0x30 },

# undocumented instructions
    DSUB => { mc => 0x08 },
    ARHL => { mc => 0x10 }, # see RRHL
    RRHL => { mc => 0x10 }, # see ARHL
    RDEL => { mc => 0x18 }, # see RLDE
    RLDE => { mc => 0x18 }, # see RDEL
    LDHI => { mc => 0x28, op => "data" }, # see ADI HL
#    ADI HL => { mc => 0x28 }, # ADI H is not supported, see LDHI
    LDSI => { mc => 0x38, op => "data" }, # see ADI SP 
#    ADI SP => { mc => 0x28 }, # ADI SP is not supported, see LDSI
    RSTV => { mc => 0xCB }, # see OVRST8
    OVRST8 => { mc => 0xCB }, # see RSTV
    SHLX => { mc => 0xD9 }, # see SHLDE
    SHLDE => { mc => 0xD9 }, # see SHLX
    JNX5 => { mc => 0xDD, op => "addr" }, # see JNK
    JNK => { mc => 0xDD, op => "addr" }, # see JNX5
    LHLX => { mc => 0xED }, # see LHLDE
    LHLDE => { mc => 0xED }, # see LHLX
    JX5 => { mc => 0xFD, op => "addr" }, # see JK
    JK => { mc => 0xFD, op => "addr" }, # see JX5
    

);#]
%I8085::directives = (#[
    ORG => { op => 'data' },
    END => {  },
    EQU => { op => 'data' },
    DB => { op => 'mdata' },
    DW => { op => 'mdata' },
    DS => { op => 'data' },
    CSEG => { op => 'page' },
    DSEG => { op => 'page' },
    BSEG => { op => 'page' },
    MACRO => { op => 'labels' },
    ENDM => {  },
    EXTRN => { op => 'labels' },
    PUBLIC => { op => 'labels' }
);#]
%I8085::registers = (#[
    A => 7, B => 0, C => 1, D => 2, E => 3, H => 4, L => 5, M => 6, SP => 8, PSW => 9
);#]
%I8085::reg = ( A => 7, B => 0, C => 1, D => 2, E => 3, H => 4, L => 5, M => 6 );
%I8085::rp = ( B => 0, D => 1, H => 2, SP => 3 );
%I8085::rpbd = ( B => 0, D => 1 );
%I8085::rppsw = ( B => 0, D => 1, H => 2, PSW => 3 );

%I8085::segments = (
    aseg => { pos => 0x0000, start => 0x0000, end => 0xffff },
    bseg => { pos => 0x8000, start => 0x8000, end => 0xffff },
    cseg => { pos => 0x0000, start => 0x0000, end => 0x3fff },
    dseg => { pos => 0x4000, start => 0x4000, end => 0x7fff }
);
$I8085::currentSegment = 'aseg';
%I8085::labels = ();
%I8085::consts = ();
%I8085::symbols = (); # pos->[ expr, width, line index ]
@I8085::memory = (undef) x 65536;
$I8085::pass = 1;
# special extension to online simulator
@I8085::modules = ();

}#]
#============================================================================#[
## <description>TODO</description>
{
package Rx;

$Rx::char = qr/'(?:\\x[[:xdigit:]]{1,2}|\\\d{1,3}|\\[^x\d]|[^'\\])'/;
$Rx::wchar = qr/'(?:\\x[[:xdigit:]]{1,2}|\\\d{1,3}|\\[^x\d]|[^'\\]){2}'/;
$Rx::string = qr/"(?:\\x[[:xdigit:]]{1,2}|\\\d{1,3}|\\[^x\d]|[^"\\])*"/;
$Rx::wrongString = qr/"/;
$Rx::number = qr/(?:\d+|\d[[:xdigit:]]*[hH]|[0-7]+[oO]|[01]+[bB])\b/;
$Rx::expr = qr/\((?:(?>[^()]+)|(??{$Rx::expr}))*\)/;
$Rx::expression = qr/[^\(\),"]*(?:$Rx::expr[^\(\),"]*)*/;
$Rx::var = qr/(?>[[:alpha:]_][[:alnum:]_]*)/;
$Rx::opprefix = qr/[!~+-]/;
$Rx::opinfix = qr/\*\*|&&|^^|\|\||[=!<>]=|<<|>>|[-+\/*%=<>&|^]/;
my $tmp = join '|', keys %I8085::instructions;
$Rx::instruction = qr/\b(?:$tmp)\b/i;
$tmp = join '|', keys %I8085::directives;
$Rx::directive = qr/\b(?:$tmp)\b/i;
$tmp = join '|', keys %I8085::registers;
$Rx::register = qr/\b(?:$tmp)\b/i;
$tmp = join '|', keys %I8085::reg;
$Rx::reg = qr/\b(?:$tmp)\b/i;
$tmp = join '|', keys %I8085::rp;
$Rx::rp = qr/\b(?:$tmp)\b/i;
$tmp = join '|', keys %I8085::rpbd;
$Rx::rpbd = qr/\b(?:$tmp)\b/i;
$tmp = join '|', keys %I8085::rppsw;
$Rx::rppsw = qr/\b(?:$tmp)\b/i;
$Rx::label = qr/(?>[_[:alpha:]][_[:alnum:]]*)[ \t]*:/;
$Rx::name = qr/(?>[_[:alpha:]][_[:alnum:]]*)/;
$Rx::comment = qr/^(?:[^"']|$Rx::char|$Rx::wchar|$Rx::string)*((?:;|\/\/).*)$/m;

$Rx::pragma = qr/^\s*#/m;

}#]
#============================================================================#[
## <description>TODO</description>
{
package Status;

#-----------------------------------------------------------------attributes-#[
## TODO
#----------------------------------------------------------------------------#]

#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub addStatusMessage(@) {
    my $aref;
    if (ref $_[0]) { $aref = shift }
    else { $aref = {@_} }

    push @Status::messages, $aref;

    return $aref;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub addError(@) {
    my $aref;
    if (ref $_[0]) { $aref = shift }
    else { $aref = {@_} }

    Status::addStatusMessage( %$aref, type => 'error' );
    ++$Status::nErrors;

    return $aref;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub addWarning(@) {
    my $aref;
    if (ref $_[0]) { $aref = shift }
    else { $aref = {@_} }

    Status::addStatusMessage( %$aref, type => 'warning' );
    ++$Status::nWarnings;

    return $aref;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub addInfo(@) {
    my $aref;
    if (ref $_[0]) { $aref = shift }
    else { $aref = {@_} }

    Status::addStatusMessage( %$aref, type => 'info' );
    ++$Status::nInfos;

    return $aref;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub toString(@) {
    my $aref;
    if (ref $_[0]) { $aref = shift }
    else { $aref = {@_} }

    my $style = $aref->{ style } || 'plain';

    my $string = '';
    if ( $style eq 'plain' ) {
        # Invalid expression at line 132 char 34
        my $nError = 0;
        my $nWarning = 0;
        foreach my $msg ( @Status::messages ) {
            my $type = '?';
            if ( $msg->{ type } eq 'error' ) { $type = "# Error:"; ++$nError }
            elsif ( $msg->{ type } eq 'warning' ) { $type = "! Warning:"; ++$nWarning }
            elsif ( $msg->{ type } eq 'info' ) { $type = "." }
            $string .= "$type $msg->{ text }"
                . ( $msg->{ line } ? " at line $msg->{ line }" : "" )
#>                . ( $msg->{ char } ? " char $msg->{ char }" : "" )
                . "\n";
        }
        $string .= "= " . ( $nError ? $nError : "No" ) . " error" . ( $nError != 1 ? 's' : '' ) . ".\n";
        $string .= "= " . ( $nWarning ? $nWarning : "No" ) . " warning" . ( $nWarning != 1 ? 's' : '' ) . ".\n";
    } elsif ( $style eq 'html' ) {
        # Invalid expression at line 132 char 34
        my $nError = 0;
        my $nWarning = 0;
        foreach my $msg ( @Status::messages ) {
            my $type = '?';
            if ( $msg->{ type } eq 'error' ) { $type = "# Error:"; ++$nError }
            elsif ( $msg->{ type } eq 'warning' ) { $type = "! Warning:"; ++$nWarning }
            elsif ( $msg->{ type } eq 'info' ) { $type = "." }
            $string .= "<span class=\"status-$msg->{ type }\">"
                . "$type $msg->{ text }"
                . ( $msg->{ line } ? " at line $msg->{ line }" : "" )
#>                . ( $msg->{ char } ? " char $msg->{ char }" : "" )
                . "</span>\n";
        }
        
        $string .= '<span class="status-' . ( $nError ? 'error' : 'info' ) . '">'
            . "= " . ( $nError ? $nError : "No" ) . " error" . ( $nError != 1 ? 's' : '' ) . ".</span>\n";
        $string .= '<span class="status-' . ( $nError ? 'warning' : 'info' ) . '">'
            . "= " . ( $nWarning ? $nWarning : "No" ) . " warning" . ( $nWarning != 1 ? 's' : '' ) . ".</span>\n";
    }

    return $string;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub getErrorCount() {
    return $Status::nErrors;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub getWarningCount() {
    return $Status::nWarnings;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub getInfoCount() {
    return $Status::nInfos;
}#]

}#]
#============================================================================#[
## <description>TODO</description>
{
package Asm85;

our $Version = '8085 assembler v0.85b, 2009-04-06; VAJDA, Ferenc';

#---precedence-#[
# ** r2l
# + - ! ~ r2l
# * / %
# + -
# << >>
# < <= > >=
# == !=      ( = is the same as == )
# &
# ^
# |
# &&
# ^^
# ||
#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub evalNumber($) {
    my ( $number ) = @_;
    if ( $number =~ /[hH]$/ ) { return hex substr $number, 0, -1 }
    elsif ( $number =~ /[bB]$/ ) { return unpack "N", pack "B32", substr "0" x 32 . $number, -33, -1 }
    elsif ( $number =~ /[oO]$/ ) { return oct substr $number, 0, -1 }
    else { return $number }
    
    return;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub evalChar($;$) {
    my ( $string, $part ) = @_;
    my $char = $string;
    unless ( $part ) { $char = substr shift, 1, -1 }
    my $code;
    my $pos = 1;
#TODO invalid char?
    if ( $char =~ /^\\/ ) {
        $char = substr $char, 1;
        if ( $char =~ /^x/ ) {
            ( $char ) = $char =~ /(\d{1,2})/;
            $pos += 1 + length $char;
            $code = hex $char;
#>            $code = hex substr $char, 1, 3; # TODO >255
#>            $pos = 4;
        } elsif ( $char =~ /^[0-7]/ ) { # TODO >255
            ( $char ) = $char =~ /(\d{1,3})/;
            $pos += length $char;
            $code = oct $char;
        } else {
            $char =~ y/abcefnrt/\a\b\c\e\f\n\r\t/;
            # BEL, BS, FS, ESC, FF, LF, CR, TAB
            $code = ord $char;
            ++$pos;
        }
    } else { $code = ord $char }
    if ( $part ) {  return $code, substr $string, $pos }
    return $code;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub evalString($) {
    my ( $string ) = @_;
    $string = substr shift, 1, -1;
    my $charArray = [];
    while ( $string ) {
        my $char;
        ( $char, $string ) = evalChar( $string, 1 );
        push @$charArray, $char;
    }
    return $charArray;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub evalWChar($;$) {
    my ( $wchar ) = @_;
    my $charArray = evalString( $wchar );
    return +( $charArray->[0] << 8 ) | $charArray->[1];
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub parse($;$) {
    my ( $expr, $posOffset ) = @_;
    $posOffset ||= 0;
    my $state = 'start';
    $expr =~ s/\s+$//; #???
    my $pos;
    my $exprarr = [];
    pos( $expr ) = 0;
    while ( pos( $expr ) < length( $expr ) ) {
        $expr =~ /\G\s+/gc;
        $pos = pos( $expr );
        if ( $state eq 'start' or $state eq 'prefix' or $state eq 'infix' ) {
            if ( $expr =~ /\G(\$(?!\$))/gc ) {
                push @$exprarr, $I8085::segments{ $I8085::currentSegment }{ pos };
                $state = 'tag';
            } elsif ( $expr =~ /\G($Rx::number)/gc ) {
                push @$exprarr, evalNumber( $1 );
                $state = 'tag';
            } elsif ( $expr =~ /\G($Rx::char)/gc ) {
                push @$exprarr, evalChar( $1 );
                $state = 'tag';
            } elsif ( $expr =~ /\G($Rx::wchar)/gc ) {
                push @$exprarr, evalWChar( $1 );
                $state = 'tag';
            } elsif ( $expr =~ /\G($Rx::var)/gc ) {
                my $name = $1;
                if ( $name =~ /^($Rx::instruction)$/ ) {
                    die [ "Instruction used in expression", ( $pos + $posOffset ) ];
                } elsif ( $name =~ /^($Rx::directive)$/ ) {
                    die [ "Directive used in expression", ( $pos + $posOffset ) ];
                } elsif ( $name =~ /^($Rx::register)$/ ) {
                    die [ "Register used in expression", ( $pos + $posOffset ) ];
                } elsif ( defined $I8085::consts{ $1 } ) {
                    push @$exprarr, $I8085::consts{ $1 };
                } else {
                    push @$exprarr, "(defined\$I8085::labels{$1}?\$I8085::labels{$1}:(push(\@main::error,'$1'),0))";
                    $main::labelnum++;
#>                    die "Unknown name at " . ( $pos + $posOffset ) . "\n";
                }
                $state = 'tag';
            } elsif ( $expr =~ /\G($Rx::expr)/gc ) {
                my $ex = $1;
                $ex =~ s/^\(//;
                $ex =~ s/\)$//;
                push @$exprarr, &parse( $ex, $pos + $posOffset + 1 );
                $state = 'tag';
            } elsif ( $expr =~ /\G($Rx::opprefix)/gc ) {
                push @$exprarr, \"P$1";
                $state = 'prefix';
            } else {
                if ( substr( $expr, $pos, 1 ) eq ')' ) { die [ "Missing opening bracket", ( $pos + $posOffset ) ] }
                if ( substr( $expr, $pos, 1 ) eq '(' ) { die [ "Missing closing bracket", ( $pos + $posOffset ) ] }
                die [ "Expression error", ( $pos + $posOffset ) ];
            }
        } elsif ( $state eq 'tag' ) {
            if ( $expr =~ /\G($Rx::opinfix)/gc ) {
                push @$exprarr, \"I$1";
                $state = 'infix';
            } else {
                if ( substr( $expr, $pos, 1 ) eq ')' ) { die [ "Missing opening bracket", ( $pos + $posOffset ) ] }
                if ( substr( $expr, $pos, 1 ) eq '(' ) { die [ "Missing closing bracket", ( $pos + $posOffset ) ] }
                die [ "Expression error", ( $pos + $posOffset ) ];
            }
        }
    }
    if ( $state ne 'tag' ) {
        die [ "Expression error", ( length( $expr ) + $posOffset ) ];
    }
    return $exprarr;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
# TODO currently internal computation is floating point!
# now:   3267 / 100 * 100 = 3267
# later: 3267 / 100 * 100 = 3200
sub perlExpr($) {
    my ( $parsed ) = @_;
    my $expr = "";
    foreach my $entry ( @$parsed ) {
        if ( ref $entry eq 'ARRAY' ) { $expr .= "(" . &perlExpr( $entry ) . ")" }
        elsif ( ref $entry eq 'SCALAR' ) { $expr .= " " . substr( $$entry, 1 ) . " " }
                                                   # e.g. !~x is not the same as ! ~ x
        else { $expr .= $entry }
    }
    return "int($expr)";
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub parseExpression($$$) {
    my ( $expr, $line, $char ) = @_;
    my $result;
    $main::labelnum = 0;
    eval{ $result = parse( $expr ) };
    if ( $@ ) {
        Status::addError( line => $line, char => $char + $@->[1],  text => $@->[0] );
        return undef;
    }
    $result = perlExpr( $result );
    if ( $main::labelnum ) { return \$result }
    use integer;
    return eval $result;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub insertData(@) {
    my ( @data ) = map { $_ & 0xff } @_;
    my $segref = $I8085::segments{ $I8085::currentSegment };
    if ( $main::noMoreInsert ) { # TODO not quite right. Maybe insert but no error...
        $segref->{ pos }++;
        return;
    }
    if ( $segref->{ pos } + @data > $segref->{ end } + 1 ) {
        Status::addError( text => "Segment boundary reached, not enough space in segment $I8085::currentSegment" );
        $main::noMoreInsert = 1;
    }
#>warn sprintf "%.4x:" . ( ' %.2x' x scalar @data ) . "\n", $segref->{ pos }, @data;
    for my $d ( @data ) {
        if ( defined $I8085::memory[ $segref->{ pos } ] and $I8085::pass < 2 ) {
            Status::addError( text => sprintf 'Overlapped memory address at %.4xH', $segref->{ pos } );
            $main::noMoreInsert = 1;
        }
#>        warn "$segref->{ pos } = $d";
        $I8085::memory[ $segref->{ pos }++ ] = $d
    }
#>    $segref->{ pos } += @data;
    return;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub allocate(@) {
    my ( $size ) = @_;
    if ( $main::noMoreInsert ) { return }
    my $segref = $I8085::segments{ $I8085::currentSegment };
    if ( $segref->{ pos } + $size > $segref->{ end } + 1 ) {
        Status::addError( text => "Segment boundary reached, not enough space in segment $I8085::currentSegment" );
        $main::noMoreInsert = 1;
    }
    for ( 1 .. $size ) {
        if ( defined $I8085::memory[ $segref->{ pos } ] ) {
            Status::addError( text => sprintf 'Overlapped memory address at %.4xH', $segref->{ pos } );
            $main::noMoreInsert = 1;
        }
        $I8085::memory[ $segref->{ pos }++ ] = -1;
    }
    return;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub parseSource($) {
    my ( $source ) = @_;
    my @lines = split /\n/, $source;
    my $lineIndex = 0;
    $I8085::consts{ ASSEMBLE_TIME } = scalar localtime time;
    $I8085::consts{ ASSEMBLER_VERSION } = $Asm85::Version;
    Status::addInfo( text => 'Processing PASS1...' );
    my $sourceEnded;
    LINE: foreach my $line ( @lines ) {
        ++$lineIndex;
        $I8085::consts{ LINE_INDEX } = $lineIndex;
        if ( $line =~ $Rx::pragma ) { #[
            $line =~ s/\s+$//s;
            $line =~ s/^\s+//s;
            my ( $command, $data ) = $line =~ /#\s*((?>\w*))\s*(.*)/;
            # skip if new pragmas:
            $data =~ s/\$(\w*);?/
                ( $1 eq '' ? $I8085::segments{ $I8085::currentSegment }{ pos } :
                  exists $I8085::consts{ $1 } ? $I8085::consts{ $1 } :
                  ''
                )
            /gex;
            if ( $command eq 'error' ) {
                Status::addError( line => $lineIndex, text => $data );
            } elsif ( $command eq 'warning' ) {
                Status::addWarning( line => $lineIndex, text => $data );
            } elsif ( $command eq 'info' ) {
                Status::addInfo( line => $lineIndex, text => $data );
            } elsif ( $command eq 'echo' ) {
                Status::addInfo( text => $data );
            } elsif ( $command eq 'import' ) {
                $data =~ s/\W.*//;
                push @I8085::modules, $data;
            } else {
                Status::addWarning( line => $lineIndex, text => 'invalid compiler pragma found' );
            }
            next LINE;
        }#]
        $line =~ s/\s*;.*//s;
        $line =~ s/\s+$//s;
        my $state = 'start';
        pos( $line ) = 0;
        my ( $instr, $direct, $label, $name, $op, $namePos, $end ) = ( undef ) x 100;

        while ( pos( $line ) < length( $line ) ) { #[
            $line =~ /\G\s*/gc;
            if ( $state eq 'start' or $state eq 'label' or $state eq 'name' ) { #[
                if ( $line =~ /\G$Rx::register/gc ) {
                    if ( $state eq 'start' and $line =~ /\G:/gc ) {
                        Status::addError( line => $lineIndex, char => $namePos, text => 'Register used as label' );
                        next LINE;
                    }
                    if ( defined $name ) {
                        Status::addError( line => $lineIndex, char => $namePos, text => 'Unknown instruction or directive' );
                        next LINE;
                    }
                    Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid usage of register' );
                    next LINE;
                } elsif ( $line =~ /\G($Rx::instruction)/gc ) {
                    if ( $state eq 'start' and $line =~ /\G:/gc ) {
                        Status::addError( line => $lineIndex, char => $namePos, text => 'Instruction used as label' );
                        next LINE;
                    }
                    $instr = uc $1;
                    if ( defined $name ) {
                        Status::addError( line => $lineIndex, char => $namePos, text => 'Name cannot be used here (maybe a ":" is missing)' );
                        next LINE;
                    }
                    $state = "instr";
#>warn "i ($line)";
                } elsif ( $line =~ /\G($Rx::directive)/gc ) {
                    if ( $state eq 'start' and $line =~ /\G:/gc ) {
                        Status::addError( line => $lineIndex, char => $namePos, text => 'Directive used as label' );
                        next LINE;
                    }
                    $direct = uc $1;
                    if ( defined $name and $direct ne 'EQU' and $direct ne 'MACRO' ) {
                        Status::addError( line => $lineIndex, char => $namePos, text => 'Name cannot be used here (maybe a ":" is missing)' );
                        next LINE;
                    }
                    $state = 'direct';
#>warn "d ($line)";
                } elsif ( $state eq 'start' and $line =~ /\G($Rx::label)/gc ) {
                    $label = $1;
                    $label =~ s/://;
                    $state = 'label';
                } elsif ( $state eq 'start' and $line =~ /\G($Rx::name)/gc ) {
                    $name = $1;
                    $state = 'name';
                    $namePos = 1 + pos( $line );
                } elsif ( $state eq 'name' ) {
                    Status::addError( line => $lineIndex, char => $namePos, text => 'Unknown Instruction or directive' );
                    next LINE;
                } else {
                    Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Syntax Error' );
                    next LINE;
                }
            } #]
            elsif ( $state eq 'instr' ) { #[
                unless ( defined $I8085::instructions{ $instr }{ op } ) {
                    Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'No operands accepted' );
                    next LINE;
                }
                if ( $end ) {
                    Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Too many operands' );
                    next LINE;
                }
                my $instref = $I8085::instructions{ $instr };
                SWITCH: {
                    if ( $instref->{ op } eq 'reg' or $instref->{ op } eq 'reg8' ) { #[
                        if ( $line =~ /\G($Rx::reg)/gc ) {
                        } else {
                            Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                            next LINE;
                        }
                        $op = $I8085::reg{ uc $1 };
                        $end = 1;
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'rp' ) { #[
                        if ( $line =~ /\G($Rx::rp)/gc ) {
                        } else {
                            Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                            next LINE;
                        }
                        $op = $I8085::rp{ uc $1 };
                        $end = 1;
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'rpbd' ) { #[
                        if ( $line =~ /\G($Rx::rpbd)/gc ) {
                        } else {
                            Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                            next LINE;
                        }
                        $op = $I8085::rpbd{ uc $1 };
                        $end = 1;
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'rppsw' ) { #[
                        if ( $line =~ /\G($Rx::rppsw)/gc ) {
                        } else {
                            Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                            next LINE;
                        }
                        $op = $I8085::rppsw{ uc $1 };
                        $end = 1;
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'dreg' ) { #[
                        unless ( $line =~ /\G($Rx::reg)/gc ) {
                            Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                            next LINE;
                        }
                        unless ( defined $op ) {
                            $op = [ $I8085::reg{ uc $1 } ];
                            my @tmp = $line =~ /\G\s*(,)/gc;
                            if ( @tmp < 1 ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                                next LINE;
                            } elsif ( @tmp > 1 ) {
                                Status::addError( line => $lineIndex, text => 'Invalid operand' );
                                next LINE;
                            }
                        } else {
                            push @$op, $I8085::reg{ uc $1 };
                            $end = 1;
                        }
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'data' or $instref->{ op } eq 'data16' or $instref->{ op } eq 'data3' #[
                            or $instref->{ op } eq 'addr' or $instref->{ op } eq 'port' ) {
#>                        if ( $line =~ /\G($Rx::register|$Rx::directive|$Rx::instruction)/gc or
#>                                   ( $line !~ /\G($Rx::expression)/gc ) or $1 eq '' ) {
                        if ( ( $line !~ /\G($Rx::expression)/gc ) or $1 eq '' ) {
                            Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                            next LINE;
                        }
                        $op = parseExpression( $1, $lineIndex, pos( $line ) );
                        unless( defined $op ) { next LINE }
                        $end = 1;
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'reg8data' ) { #[
                        unless ( defined $op ) {
                            unless ( $line =~ /\G($Rx::reg)/gc ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                                next LINE;
                            }
                            $op = [ $I8085::reg{ uc $1 } ];
                            my @tmp = $line =~ /\G\s*(,)/gc;
                            if ( @tmp < 1 ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                                next LINE;
                            } elsif ( @tmp > 1 ) {
                                Status::addError( line => $lineIndex, text => 'Invalid operand' );
                                next LINE;
                            }
                        } else {
                            unless ( $line =~ /\G($Rx::expression)/gc and $1 ne '' ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                                next LINE;
                            }
                            push @$op, parseExpression( $1, $lineIndex, pos( $line ) );
                            unless( defined $op->[ -1 ] ) { next LINE }
                            $end = 1;
                        }
                        last SWITCH;
                    } #]
                    elsif ( $instref->{ op } eq 'rpdata' ) { #[
                        unless ( defined $op ) {
                            unless ( $line =~ /\G($Rx::rp)/gc ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                                next LINE;
                            }
                            $op = [ $I8085::rp{ uc $1 } ];
                            my @tmp = $line =~ /\G\s*(,)/gc;
                            if ( @tmp < 1 ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                                next LINE;
                            } elsif ( @tmp > 1 ) {
                                Status::addError( line => $lineIndex, text => 'Invalid operand' );
                                next LINE;
                            }
                        } else {
                            unless ( $line =~ /\G($Rx::expression)/gc and $1 ne '' ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid operand' );
                                next LINE;
                            }
                            push @$op, parseExpression( $1, $lineIndex, pos( $line ) );
                            unless( defined $op->[ -1 ] ) { next LINE }
                            $end = 1;
                        }
                        last SWITCH;
                    } #]
                    else { #[
                        warn "unknown operand type '$instref->{op}'";
pos( $line ) = length( $line );
                    } #]
                }
            } #]
            elsif ( $state eq 'direct' ) { #[
                unless ( defined $I8085::directives{ $direct }{ op } ) {
                    Status::addWarning( line => $lineIndex, char => 1 + pos( $line ), text => 'No paramaters accepted' );
                    pos( $line ) = length( $line );
                } else {
                    my $directref = $I8085::directives{ $direct };
                    if ( $end ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Too many parameters' );
                        next LINE;
                    }
                    SWITCH: {
                        if ( $directref->{ op } eq 'data' ) {
                            unless ( $line =~ /\G($Rx::expression)/gc and $1 ne '' ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid parameter' );
                                next LINE;
                            }
                            $op = parseExpression( $1, $lineIndex, pos( $line ) );
                            unless( defined $op ) { next LINE }
                            if( ref $op ) {
                                Status::addError( line => $lineIndex, text => 'Only constant expressions are allowed' );
                                next LINE;
                            }
                            $end = 1;
                            last SWITCH;
                        } elsif ( $directref->{ op } eq 'mdata' ) {
#>                            if ( $line =~ /\G($Rx::expression)/gc and $1 ne '' ) {
#>                                unless ( defined $op ) { $op = [] }
#>                                push @$op, parseExpression( $1, $lineIndex, pos( $line ) );
#>                                unless( defined $op->[ -1 ] ) { next LINE }
#>                            } elsif ( $line =~ /\G($Rx::string)/gc ) {
#>                                push @$op, @{ evalString( $1 ) }
#>                            } elsif ( $line =~ /\G($Rx::wrongString)/gc ) {
#>                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid string' );
#>                                next LINE;
#>                            } else {
#>                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid parameter' );
#>                                next LINE;
#>                            }
                            if ( $line =~ /\G(?:\s*(?:,|$))/gc ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing parameter' );
                                next LINE;
                            } elsif ( $line =~ /\G($Rx::string)/gc ) {
                                push @$op, @{ evalString( $1 ) }
                            } elsif ( $line =~ /\G($Rx::wrongString)/gc ) {
                                Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid string' );
                                next LINE;
                            } else {
                                $line =~ /\G([^,]*)/gc;
                                unless ( defined $op ) { $op = [] }
                                push @$op, parseExpression( $1, $lineIndex, pos( $line ) );
                                unless( defined $op->[ -1 ] ) { next LINE }
                            }
                            my @tmp = $line =~ /\G\s*(,)/gc;
                            if ( @tmp < 1 ) {
                                $end = 1;
                            } elsif ( @tmp > 1 ) {
                                Status::addError( line => $lineIndex, text => 'Invalid operand' );
                                next LINE;
                            }
                            last SWITCH;
                        } elsif ( $directref->{ op } eq 'page' ) {
                            unless ( $line =~ /\Gpage/gci ) {
                                Status::addWarning( line => $lineIndex, char => 1 + pos( $line ), text => 'Invalid parameter' );
                                pos( $line ) = length( $line );
                            } else {
                                $op = 1;
                            }
                            $end = 1;
                        } else {
    pos( $line ) = length( $line );
                        }
                    }
                }
            } #] 
            else { #[
                warn "?";
pos( $line ) = length( $line );
            } #]
        } #]

        if ( defined $name ) { #[
            if ( defined $instr or defined $direct and $direct ne 'EQU' and $direct ne 'MACRO' ) {
#>            unless ( defined $direct ) {
                Status::addError( line => $lineIndex, char => $namePos, text => 'Invalid usage of name' );
                next LINE;
            } elsif ( not defined $instr and not defined $direct ) {
                Status::addError( line => $lineIndex, char => $namePos, text => 'Unknown instruction or directive' );
                next LINE;
            }
        } #]
        if ( defined $label ) { #[
            if ( exists $I8085::labels{ $label } ) {
                Status::addError( line => $lineIndex, text => 'Label redefinition' );
            } elsif ( exists $I8085::consts{ $label } ) {
                Status::addError( line => $lineIndex, text => 'Label already in use as a name' );
            } else {
                $I8085::labels{ $label } = $I8085::segments{ $I8085::currentSegment }{ pos };
            }
        } #]
        if ( defined $instr ) { #[
            my $instref = $I8085::instructions{ $instr };
            SWITCH: {
                if ( not defined $instref->{ op } ) { #[
                    insertData( $instref->{ mc } );
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'reg' ) { #[
                    if ( not defined $op ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    insertData( $instref->{ mc } + $op );
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'reg8' ) { #[
                    if ( not defined $op ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    insertData( $instref->{ mc } + ( $op << 3 ) );
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'rp' or $instref->{ op } eq 'rpbd' or $instref->{ op } eq 'rppsw' ) { #[
                    if ( not defined $op ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    insertData( $instref->{ mc } + ( $op << 4 ) );
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'dreg' ) { #[
                    if ( not defined $op or @$op < 2 ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    } elsif ( $op->[0] == 6 and $op->[1] == 6 ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Multiple M operand is not allowed' );
                        next LINE;
                    }
                    insertData( $instref->{ mc } + ( $op->[0] << 3 ) + $op->[1] );
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'data' or $instref->{ op } eq 'port' ) { #[
                    if ( not defined $op ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    if ( ref $op ) {
                        $I8085::symbols{ 1 + $I8085::segments{ $I8085::currentSegment }{ pos } } = [ $$op, 1, $lineIndex ];
                        insertData( $instref->{ mc }, 0 );
                    } else {
                        if ( $op < ( $instref->{ op } eq 'port' ? 0 : -128 ) or $op > 255 ) {
                            Status::addWarning( line => $lineIndex, text => 'Operand does not fit in 8 bits' );
                        }
                        insertData( $instref->{ mc }, $op & 0xff );
                    }
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'data16' or $instref->{ op } eq 'addr' ) { #[
                    if ( not defined $op ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    if ( ref $op ) {
                        $I8085::symbols{ 1 + $I8085::segments{ $I8085::currentSegment }{ pos } } = [ $$op, 2, $lineIndex ];
                        insertData( $instref->{ mc }, 0, 0 );
                    } else {
                        if ( $op < ( $instref->{ op } eq 'addr' ? 0 : -32768 ) or $op > 65535 ) {
                            Status::addWarning( line => $lineIndex, text => 'Operand does not fit in 16 bits' );
                        }
                        insertData( $instref->{ mc }, $op & 0xff, ( $op >> 8 ) & 0xff );
                    }
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'data3' ) { #[
                    if ( not defined $op ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    if ( ref $op or $op < 0 or $op > 7 ) {
                        Status::addWarning( line => $lineIndex, text => 'Invalid operand' );
                    }
                    insertData( $instref->{ mc } + ( $op << 3 ) );
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'reg8data' ) { #[
                    if ( not defined $op or @$op < 2 ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    if ( ref $op->[1] ) {
                        $I8085::symbols{ 1 + $I8085::segments{ $I8085::currentSegment }{ pos } } = [ ${ $op->[ 1 ] }, 1, $lineIndex ];
                        insertData( $instref->{ mc } + ( $op->[ 0 ] << 3 ), 0 );
                    } else {
                        if ( $op->[ 1 ] < -128 or $op->[ 1 ] > 255 ) {
                            Status::addWarning( line => $lineIndex, text => 'Operand does not fit in 8 bits' );
                        }
                        insertData( $instref->{ mc } + ( $op->[ 0 ] << 3 ), $op->[ 1 ] & 0xff );
                    }
                    last SWITCH;
                } #]
                elsif ( $instref->{ op } eq 'rpdata' ) { #[
                    if ( not defined $op or @$op < 2 ) {
                        Status::addError( line => $lineIndex, char => 1 + pos( $line ), text => 'Missing operand' );
                        next LINE;
                    }
                    if ( ref $op->[1] ) {
                        $I8085::symbols{ 1 + $I8085::segments{ $I8085::currentSegment }{ pos } } = [ ${ $op->[ 1 ] }, 2, $lineIndex ];
                        insertData( $instref->{ mc } + ( $op->[ 0 ] << 4 ), 0, 0 );
                    } else {
                        if ( $op->[ 1 ] < -32768 or $op->[ 1 ] > 65535 ) {
                            Status::addWarning( line => $lineIndex, text => 'Operand does not fit in 16 bits' );
                        }
                        insertData( $instref->{ mc } + ( $op->[ 0 ] << 4 ), $op->[ 1 ], $op->[ 1 ] >> 8 );
                    }
                    last SWITCH;
                } #]
                else { #[
                    warn "unknown operand type '$instref->{op}'";
                } #]
            }
        } #]
        if ( defined $direct ) { #[
            if ( defined $name and $direct ne 'EQU' and $direct ne 'MACRO' ) {
                Status::addWarning( line => $lineIndex, char => $namePos, text => 'Name cannot be used here (maybe a ":" is missing)' );
            }
            SWITCH: {
                if ( $direct eq 'ORG' ) {
                    unless( defined $op ) {
                        Status::addError( line => $lineIndex, text => 'Missing paramater' );
                        next LINE;
                    }
                    my $seg = $I8085::segments{ $I8085::currentSegment };
                    if ( $op < $seg->{ start } or $op > $seg->{ end } ) {
                        Status::addError( line => $lineIndex, text => 'Address out of bounds' );
                        next LINE;
                    }
                    $seg->{ pos } = $op;
                    last SWITCH;
                } elsif ( $direct eq 'CSEG' ) {
                    $I8085::currentSegment = 'cseg';
                    if ( $op ) {
                        my $segm = $I8085::segments{ cseg };
                        if ( $segm->{ pos } & 0xff ) { $segm->{ pos } = ( $segm->{ pos } & ~0xff ) + 0x100 }
                    }
                    last SWITCH;
                } elsif ( $direct eq 'DSEG' ) {
                    $I8085::currentSegment = 'dseg';
                    if ( $op ) {
                        my $segm = $I8085::segments{ dseg };
                        if ( $segm->{ pos } & 0xff ) { $segm->{ pos } = ( $segm->{ pos } & ~0xff ) + 0x100 }
                    }
                    last SWITCH;
                } elsif ( $direct eq 'BSEG' ) {
                    $I8085::currentSegment = 'bseg';
                    if ( $op ) {
                        my $segm = $I8085::segments{ bseg };
                        if ( $segm->{ pos } & 0xff ) { $segm->{ pos } = ( $segm->{ pos } & ~0xff ) + 0x100 }
                    }
                    last SWITCH;
                } elsif ( $direct eq 'EQU' ) {
                    unless( defined $op ) {
                        Status::addError( line => $lineIndex, text => 'Missing paramater' );
                        next LINE;
                    }
                    unless( defined $name ) {
                        Status::addError( line => $lineIndex, text => 'Missing name' );
                        next LINE;
                    } 
                    if( exists $I8085::consts{ $name } or exists $I8085::labels{ $name } ) {
                        Status::addError( line => $lineIndex, text => 'Name already in use' );
                        next LINE;
                    }
                    # currently constants are 
                    $I8085::consts{ $name } = $op;
                    last SWITCH;
                } elsif ( $direct eq 'DB' ) {
                    if ( defined $op ) {
                        for my $bdata ( @$op ) {
                            unless ( ref $bdata ) {
                                if ( $bdata < -128 or $bdata > 255 ) {
                                    Status::addWarning( line => $lineIndex, text => 'Operand does not fit in 8 bits' );
                                }
                                insertData( $bdata );
                            } else {
#>                                $I8085::symbols{ 1 + $I8085::segments{ $I8085::currentSegment }{ pos } } = [ $$bdata, 1, $lineIndex ];
                                $I8085::symbols{ $I8085::segments{ $I8085::currentSegment }{ pos } } = [ $$bdata, 1, $lineIndex ];
                                insertData( 0 );
                            }
                        }
                    }
                    last SWITCH;
                } elsif ( $direct eq 'DW' ) {
                    if ( defined $op ) {
                        for my $bdata ( @$op ) {
                            unless ( ref $bdata ) {
                                if ( $bdata < -32768 or $bdata > 65535 ) {
                                    Status::addWarning( line => $lineIndex, text => 'Operand does not fit in 16 bits' );
                                }
                                insertData( $bdata, $bdata >> 8 );
                            } else {
#>                                $I8085::symbols{ 1 + $I8085::segments{ $I8085::currentSegment }{ pos } } = [ $$bdata, 2, $lineIndex ];
                                $I8085::symbols{ $I8085::segments{ $I8085::currentSegment }{ pos } } = [ $$bdata, 2, $lineIndex ];
                                insertData( 0, 0 );
                            }
                        }
                    }
                    last SWITCH;
                } elsif ( $direct eq 'DS' ) {
                    unless( defined $op ) {
                        Status::addError( line => $lineIndex, text => 'Missing paramater' );
                        next LINE;
                    }
                    if ( $op < 0 or $op > 65535 ) {
                        Status::addError( line => $lineIndex, text => 'Invalid size' );
                        next LINE;
                    }
                    allocate( $op );
                    last SWITCH;
                } elsif ( $direct eq 'MACRO' ) {
                    Status::addWarning( line => $lineIndex, text => 'Macros are currently not supported' );
                    next LINE;
                } elsif ( $direct eq 'ENDM' ) {
                    Status::addWarning( line => $lineIndex, text => 'Macros are currently not supported' );
                    next LINE;
                } elsif ( $direct eq 'PUBLIC' ) {
                    Status::addWarning( line => $lineIndex, text => 'Multiple files are currently not supported' );
                    next LINE;
                } elsif ( $direct eq 'EXTRN' ) {
                    Status::addWarning( line => $lineIndex, text => 'Multiple files are currently not supported' );
                    next LINE;
                } elsif ( $direct eq 'END' ) {
                    $sourceEnded = 1;
                    last LINE;
                }
            }
        } #]

    }
    unless ( $sourceEnded ) {
        Status::addWarning( text => "Directive 'END' not found" );
    }
    Status::addInfo( text => 'Processing PASS2...' );
    $I8085::currentSegment = 'aseg';
    $I8085::pass = 2;
    foreach my $address ( keys %I8085::symbols ) {
        @main::error = ();
        my $data = $I8085::symbols{ $address };
        my $value;
        {
            use integer;
            $value = eval $data->[0];
        }
        if ( @main::error ) {
            Status::addError( line => $data->[2], text => 'Unknown label' . ( @main::error > 1 ? 's ' : ' ' ) .
                join( ", ", @main::error ) . ' in expression' );
            next;
        }
        if ( $data->[ 1 ] == 1 ) {
            if ( $value < -128 or $value > 255 ) {
                Status::addWarning( line => $data->[2], text => 'Operand does not fit in 8 bits' );
            }
            $I8085::segments{ aseg }{ pos } = $address;
            insertData( $value );

        } elsif ( $data->[ 1 ] == 2 ) {
            if ( $value < -32768 or $value > 65535 ) {
                Status::addWarning( line => $data->[2], text => 'Operand does not fit in 16 bits' );
            }
            $I8085::segments{ aseg }{ pos } = $address;
            insertData( $value, $value >> 8 );
        }

    }
    return;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub createIhx() {
    my $ihx = "";
    for my $row ( 0 .. 4095 ) {
        my @data = @I8085::memory[ ( $row << 4 ) .. ( $row << 4 ) + 15 ];
        unless ( grep { defined $_ and $_ > 0 } @data ) { next }
        my @hxdata = ();
        my $state = 0;
        for my $ndx ( 0 .. 15 ) {
            my $d = $data[ $ndx ];
            if ( $state == 0 ) {
                if ( defined $d and $d >= 0 ) {
                    push @hxdata, [ ( $row << 4 ) + $ndx, $d ];
                    $state = 1;
                }
            } else {
                if ( defined $d and $d >= 0 ) {
                    push @{ $hxdata[ -1 ] }, $d;
                } else {
                    $state = 0;
                }
            }
        }
        for my $hdat ( @hxdata ) { 
            my $chksum = -( @$hdat - 1 ) - ( $hdat->[ 0 ] >> 8 );
            for ( @$hdat ) { $chksum -= $_ }
            $ihx .= sprintf ':%.2X%.4X00' . '%.2X' x @$hdat . "\r\n", @$hdat - 1, @$hdat, $chksum & 0xff;
#>            printf "%.4x %d\n", $_->[0], @$_ - 1;
        }
    }
    foreach my $moduleName ( @I8085::modules ) {
        my @bytes = map { ord $_ } split //, $moduleName;
        my $chksum = 0x20 - length( $moduleName ); # -E0 (load Module), length
        foreach ( map { ord $_ } split //, $moduleName ) { $chksum -= $_ }
        $chksum &= 0xff;
        $ihx .= sprintf ':%.2X0000E0%s%.2X'."\r\n", length( $moduleName ), uc( unpack "H*", $moduleName ), $chksum;
    }
    $ihx .= ":00000001FF\r\n";
    return $ihx;
}#]

}#]

1;

