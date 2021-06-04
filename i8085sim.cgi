#!/usr/bin/perl -w
#-----------------------------------------------------------------------info-#[
## <info> TODO
## </info>
#----------------------------------------------------------------------------#]
use strict;
use CGI;
use lib '.';
use Asm85;
use Encode qw/from_to/;

open STDERR, ">>error.log";

@main::registers = qw/ A B C D E H L SP PSW M /;
@main::instructions = qw/
    MOV MVI LXI LDA STA LHLD SHLD LDAX STAX XCHG 
    ADD ADC ADI ACI SUB SBB SUI SBI INR DCR INX DCX DAD DAA
    ANA ANI XRA XRI ORA ORI CMP CPI CMA CMC STC RRC RLC RAR RAL
    JMP JNZ JZ JNC JC JPO JPE JP JM CALL CNZ CZ CNC CC CPO CPE CP CM RET RNZ RZ RNC RC RPO RPE RP RM RST PCHL
    PUSH POP XTHL SPHL IN OUT EI DI HLT NOP RIM SIM
    /;
@main::directives = qw/ ORG END EQU DB DW DS /;
@main::modules = ();

#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub test_ihx($) {
    my ( $ihx ) = @_;
    my $isihx = 1;
#TODO
    return $isihx;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub ihx2Array($) {
    my ( $ihx ) = @_;
    if ( not test_ihx( $ihx ) ) { return "// invalid intel hex file\n" }
    my $array = "var ____ = undefined;\ninit_mem = new Array (\n";
    my @arr = ( undef ) x 65536;
    my $max = -1;
    while ( $ihx =~ /^:([[:xdigit:]]*)/m ) {
        my $row = $1;
        $ihx = $';
        my ( $bytenum, $address, $type, $data, $checksum ) =
            $row =~ /(..)(....)(..)(.*)(..)/;
        $bytenum = hex $bytenum;
        $address = hex $address;
        $type = hex $type;
#>        $data = [ map { hex $_ } split( /(?=(?:..)*$)/, $data ) ];
        $data = [ split( /(?=(?:..)*$)/, $data ) ];
        $checksum = hex $checksum;
        if ( $type == 1 ) { last }
        if ( $type == 0xE0 ) {
            push @main::modules, pack "H*", join "", @$data;
#>            push @main::modules, join "", @$data;
            next;
        }
        if ( $type ) { next }
        # TODO check sum
        for ( 0 .. $bytenum - 1 ) { 
            $arr[ $address + $_ ] = $data->[ $_ ];
            if ( $max < $address + $_ ) { $max = $address + $_ }
        }
    }
    for ( 0 .. $max ) {
        if ( ( $_ & 0x0f ) == 0x00 ) { $array .= "   " }
        my $d = ( defined $arr[$_] ? "0x$arr[$_]" : "____" );
        $array .= " $d" . ( $_ != $max ? "," : "" );
#>        $array .= " 0x" . ( $arr[$_] || "00" ) . ( $_ != $max ? "," : "" );
        if ( ( $_ & 0x0f ) == 0x0f ) { 
            if ( ( $_ & 0xf0 ) == 0x00 ) { 
                $array .= sprintf ' // %.4X', $_ & 0xfff0;
            }
            $array .= "\n";
        }
    }
    if ( ( $max & 0x0f ) != 0x0f ) { $array .= "\n" }
    $array .= ");\n";
    return $array;
}#]
#----------------------------------------------------------------------------#[
## <description>TODO</description>
sub syntaxhl($) {
    my ( $text ) = @_;
    my $html = "";
    $text =~ s/\r//gs;
    while ( length $text ) {
        if ( $text =~ /^#[^;]*/ ) {#]
            $html .= "<span class=\"shlpra\">$&</span>";
            $text = $';
        } elsif ( $text =~ /^\s+/s ) {
            $html .= $&;
            $text = $';
        } elsif ( $text =~ /^\d(?:[[:xdigit:]]*h|[01]*b|[0-7]*o|\d*)/i ) {
            $html .= "<span class=\"shlnum\">$&</span>";
            $text = $';
        } elsif ( $text =~ /^\w+/ ) {
            my $tx = $&;
            $text = $';
            if ( grep /^$tx$/, @main::instructions ) {
                $html .= "<span class=\"shlins\">$tx</span>";
            } elsif ( grep /^$tx$/, @main::registers ) {
                $html .= "<span class=\"shlreg\">$tx</span>";
            } elsif ( grep /^$tx$/, @main::directives ) {
                $html .= "<span class=\"shldrc\">$tx</span>";
            } else {
                $html .= "<span class=\"shllbl\">$tx</span>";
            }
        } elsif ( $text =~ /^"(\\"|[^"])*"/i ) {
            $html .= "<span class=\"shlstr\">$&</span>";
            $text = $';
        } elsif ( $text =~ /^'(\\'|[^'])*'/i ) {
            $html .= "<span class=\"shlstr\">$&</span>";
            $text = $';
        } elsif ( $text =~ /^;.*/ ) {
            $html .= "<span class=\"shlcmt\">$&</span>\n";
            $text = substr( $', 1 );
        } else {
            $html .= substr( $text, 0, 1 );
            $text = substr( $text, 1 );
        }
    }
    return $html;
}#]

my $q = new CGI;
print $q->header( -charset => 'utf-8' );

undef $/;
my $src =  $q->param( 'source' );
my $fileid = $q->param( 'fileid' );
my $filename;
my $file = $q->param( 'file' );
my $source = $q->param( 'asm' );
if ( defined $fileid and $fileid ne '' ) {
    $filename = "$fileid.ihx";
    open $file, "files/$filename";
} elsif ( $file ) {
#>} else {
#>    $file = $q->param( 'file' );
    $filename = $file;
} elsif ( $source ) {
    $filename = "<temporary>";
}
if ( defined $filename and $filename ne ''  ) {
    my $fdata;
    if ( $file ) {
        $fdata = <$file>;
    } else {
        $fdata = $source;
    }
    my $insert = "// file: $filename\n";
    my $status;
    if ( $fdata !~ /^\s*:/s ) {
        from_to( $fdata, 'utf-8', 'iso-8859-2' );
        Asm85::parseSource( $fdata );
        $fdata = Asm85::createIhx();
        $status = Status::toString( style => 'html' );
    }
    $insert .= ihx2Array( $fdata );
    open HTML, "i8085sim.html";
    my $html = <HTML>;
    close HTML;
    my $moduleImport = join "\n    ", ( map { "<script type=\"text/javascript\" src=\"modules/$_.js\"></script>" } @main::modules), '';
    $html =~ s/(<script\s+id="mem_script"\s*>)\s*(<\/script>)/$moduleImport$1\n$insert$2/si;
    if ( $status ) {
        $html =~ s/<\/body>/<div id="asm85-status" class="block"><div>$status<\/div><\/div>/
    }
    print $html;
#>} elsif ( defined $filename and $filename ne '' ) {
#>    open HTML, "i8085sim.html";
#>    my $html = <HTML>;
#>    close HTML;
#>    $html =~ s/(<script\s+id="mem_script")\s*>\s*(<\/script>)/$1 src="files\/$filename.ihx">$2/si;
#>    print $html;
} elsif( defined $src and $src ne "" ) {
    open SRC, "files/$src.a85";
    binmode SRC, ":encoding(iso-8859-2)";
    my $srctxt = <SRC>;
    close SRC;

    my $srcu8 = ""; # convert to utf8
    open MEMORY, ">", \$srcu8;
    binmode MEMORY, ":utf8";
    print MEMORY $srctxt;

    $srctxt = syntaxhl( $srcu8 );

# TODO highlight
    open HTML, "source.html";
    my $html = <HTML>;
    close HTML;
    $html =~ s/<\?x85\s+sourcename\s*\?>/$src.a85/si;
    $html =~ s/<\?x85\s+source\s*\?>/<pre id="srctxt">$srctxt<\/pre>/si;
    print $html;
} else {
    opendir DIR, "files/gyak";
    my @files = map { s/\.ihx//; $_ } grep /\.ihx$/, readdir DIR;
    close DIR;
    my $filelist_gyak = join "", map { "<div class=\"importfile\"><a href=\"i8085sim.cgi?fileid=gyak%2F$_\">$_</a> &nbsp; <a href=\"i8085sim.cgi?source=gyak%2F$_\">source</a></div>" } sort @files;
    opendir DIR, "files/module";
    @files = map { s/\.ihx//; $_ } grep /\.ihx$/, readdir DIR;
    close DIR;
    my $filelist_module = join "", map { "<div class=\"importfile\"><a href=\"i8085sim.cgi?fileid=module%2F$_\">$_</a> &nbsp; <a href=\"i8085sim.cgi?source=module%2F$_\">source</a></div>" } sort @files;
    opendir DIR, "files/misc";
    @files = map { s/\.ihx//; $_ } grep /\.ihx$/, readdir DIR;
    close DIR;
    my $filelist_misc = join "", map { "<div class=\"importfile\"><a href=\"i8085sim.cgi?fileid=misc%2F$_\">$_</a> &nbsp; <a href=\"i8085sim.cgi?source=misc%2F$_\">source</a></div>" } sort @files;
    opendir DIR, "files/course";
    @files = map { s/\.ihx//; $_ } grep /\.ihx$/, readdir DIR;
    close DIR;
    my $filelist_course = join "", map { "<div class=\"importfile\"><a href=\"i8085sim.cgi?fileid=course%2F$_\">$_</a> &nbsp; <a href=\"i8085sim.cgi?source=course%2F$_\">source</a></div>" } sort @files;

    open HTML, "import.html";
    my $html = <HTML>;
    close HTML;
    $html =~ s/<\?x85\s+filelist\s+gyak\s*\?>/$filelist_gyak/si;
    $html =~ s/<\?x85\s+filelist\s+module\s*\?>/$filelist_module/si;
    $html =~ s/<\?x85\s+filelist\s+misc\s*\?>/$filelist_misc/si;
    $html =~ s/<\?x85\s+filelist\s+course\s*\?>/$filelist_course/si;
    print $html;
}

exit 0;

